import * as lambda from "aws-lambda"

import { Credentials } from "@aws-sdk/types"
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { CommandInterface, DomainEventEnvelope } from "stochastic"
import { Context, SQSEvent } from "aws-lambda"
import { Component } from "stochastic"
import { connectAggregateInterface, storeEvent } from "./event-store"
import { TextEncoder } from "util"

export interface RuntimeOptions {
  credentials?: Credentials
}

export interface Runtime {
  readonly component: Component
  readonly handler: lambda.Handler
}

export class LambdaRuntime implements Runtime {
  readonly lambda: LambdaClient
  readonly handler: lambda.Handler
  constructor(
    readonly component: Component,
    readonly componentName: string,
    readonly names: Map<Component, string>,
    options?: RuntimeOptions
  ) {
    this.lambda = new LambdaClient({ credentials: options?.credentials })

    const handlerName = process.env.COMPONENT_NAME
    if (handlerName === undefined) {
      throw new Error(`environment variable not set: 'COMPONENT_NAME'`)
    }

    if (component === undefined) {
      throw new Error(`no such handler: '${handlerName}'`)
    }

    if (component.kind === "Command") {
      //lookup table to map `__typename` to the static `DomainEvent` class.
      const domainEventLookupTable = component.events
        .map(eventType => ({
          [eventType.__typename]: eventType // sorry I meant __key doesn't exist. Yes it does?
        }))
        .reduce((a, b) => ({ ...a, ...b }), {})

      const tableName = process.env["EVENT_STORE_TABLE"]
      if (tableName === undefined) {
        throw new Error("missing environment variable: EVENT_STORE_TABLE")
      }
      const { initialState, reducer } = component.aggregate
      const source = component.aggregate.stateShape.name

      this.handler = async event => {
        console.log({ event })
        console.log(JSON.stringify({ component }, null, 2))
        console.log({ aggregate: component.aggregate })

        // TODO: command response type is too vague to work with
        const commandResponse = await component.execute(
          event,
          connectAggregateInterface({
            eventStore: tableName,
            source,
            initialState,
            reducer
          })
        )
        console.log(JSON.stringify({ commandResponse }, null, 2))

        const events = (Array.isArray(commandResponse) ? commandResponse : commandResponse.events).map(
          eventInstance => {
            const event = domainEventLookupTable[eventInstance.__typename]
            if (event === undefined) {
              throw new Error("FUCK")
            }
            return new DomainEventEnvelope({ source, source_id: eventInstance[event.__key], payload: eventInstance })
          }
        )
        const confirmation = Array.isArray(commandResponse) ? undefined : commandResponse.confirmation ?? events

        await Promise.all(
          events.map(async evt => {
            await storeEvent(tableName, evt)
          })
        )
        console.log(JSON.stringify({ events }, null, 2))
        console.log(JSON.stringify({ confirmation }, null, 2))
        return confirmation
      }
    } else if (component.kind === "ReadModel" || component.kind === "EventHandler") {
      const dependencyEnv = component.dependencies
        .map(dep => ({
          [dep.name]: process.env[`DEPENDENCY_${dep.name}`]
        }))
        .reduce((a, b) => ({ ...a, ...b }), {})

      let initializedHandler: any
      this.handler = (event: SQSEvent, context: Context) => {
        if (initializedHandler === undefined) {
          initializedHandler = component.handle(dependencyEnv as any, context)
        }
        return initializedHandler(event)
      }
    } else if (component.kind === "Policy") {
      // where
      const commands = component.commands.map(command => {
        const commandName = names.get(command)!
        const lambdaArn = process.env[`${commandName}_LAMBDA_ARN`]
        if (lambdaArn === undefined) {
          throw new Error(`missing environment variable: '${commandName}_LAMBDA_ARN'`)
        }
        return async (input: any) =>
          this.lambda.send(
            new InvokeCommand({
              FunctionName: lambdaArn,
              Payload: new TextEncoder().encode(JSON.stringify(input))
            })
          )
      }) as CommandInterface<typeof component["commands"]>
      this.handler = (event: SQSEvent, context) =>
        Promise.all(event.Records.map(record => component.apply(JSON.parse(record.body), ...commands)))
    }
  }
}
