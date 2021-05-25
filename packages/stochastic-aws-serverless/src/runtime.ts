import * as lambda from "aws-lambda"

import { Credentials } from "@aws-sdk/types"
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { Command, Config, DomainEventEnvelope, Init, ReadModel } from "stochastic"
import { Context, SQSEvent } from "aws-lambda"
import { Component } from "stochastic"
import { connectStoreInterface, storeEvent } from "./event-store"
import { TextEncoder } from "util"

export interface RuntimeOptions {
  credentials?: Credentials
}

export interface Runtime {
  readonly component: Component
  readonly handler: Init<lambda.Handler>
}

export class LambdaRuntime implements Runtime {
  readonly lambda: LambdaClient
  readonly handler: Init<lambda.Handler>
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
      const { initialState, reducer } = component.store
      const source = component.store.stateShape.name

      this.handler = memoize(context => {
        const command = component.init(context)

        return async event => {
          console.log({ event })
          console.log(JSON.stringify({ component }, null, 2))
          console.log({ store: component.store })

          // TODO: command response type is too vague to work with
          const commandResponse = await command(
            event,
            connectStoreInterface({
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
      })
    } else if (component.kind === "EventHandler") {
    } else if (component.kind === "ReadModel") {
      this.handler = memoize(context => component.init(getConfiguration(component.config) as any, context))
    } else if (component.kind === "Policy") {
      this.handler = memoize(context => {
        const commands = initCommands(component.commands, names, this.lambda)
        const readModels = initReadModels(component.reads, context)
        const policy = component.init(context)

        return async (event: SQSEvent, context: Context) => {
          Promise.all(event.Records.map(record => policy(JSON.parse(record.body), commands, readModels, context)))
        }
      })
    } else if (component.kind === "Query") {
      this.handler = memoize(context => {
        const query = component.init(initReadModels(component.readModels, context), context)

        return (event: any, context: any) => query(event /* TODO: deserialization */, context)
      })
    }
  }
}

function memoize<T>(f: (context: any) => T): (context: any) => T {
  let t: T
  let init: boolean = false

  return context => {
    if (init === false) {
      t = f(context)
      init = true
    }
    return t
  }
}

function initCommands(commands: Record<string, Command>, names: Map<Component, string>, lambda: LambdaClient) {
  return Object.entries(commands as Record<string, Command>)
    .map(([key, command]) => {
      const commandName = names.get(command)!
      const lambdaArn = process.env[`${commandName}_LAMBDA_ARN`]
      if (lambdaArn === undefined) {
        throw new Error(`missing environment variable: '${commandName}_LAMBDA_ARN'`)
      }
      return {
        [key]: async (input: any) =>
          lambda.send(
            new InvokeCommand({
              FunctionName: lambdaArn,
              Payload: new TextEncoder().encode(JSON.stringify(input))
            })
          )
      }
    })
    .reduce((a, b) => ({ ...a, ...b }), {})
}

function initReadModels(readModels: Record<string, ReadModel>, context: any) {
  return Object.entries(readModels)
    .map(([key, readModel]) => {
      return {
        [key]: readModel.client(getConfiguration(readModel.config), context)
      }
    })
    .reduce((a, b) => ({ ...a, ...b }), {})
}

function getConfiguration(dependencies: Config[]) {
  return dependencies
    .map(dependency => ({
      [dependency.name]: process.env[`DEPENDENCY_${dependency.name}`]
    }))
    .reduce((a, b) => ({ ...a, ...b }), {}) as any
}
