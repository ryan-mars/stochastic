import * as lambda from "aws-lambda"

import { Credentials } from "@aws-sdk/types"
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { Command, Config, DomainEventEnvelope, Init, ReadModel } from "stochastic"
import { Context, SQSEvent } from "aws-lambda"
import { Component } from "stochastic"
import { connectStoreInterface, storeEvent } from "./event-store"
import { TextEncoder } from "util"

import { createMetricsLogger, metricScope, MetricsLogger, Unit } from "aws-embedded-metrics"

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
    options?: RuntimeOptions,
  ) {
    this.lambda = new LambdaClient({ credentials: options?.credentials })
    const log_level = (process.env["LOG_LEVEL"] ?? "info").toLowerCase()
    const handlerName = process.env.COMPONENT_NAME
    if (handlerName === undefined) {
      throw new Error(`environment variable not set: 'COMPONENT_NAME'`)
    }

    if (component === undefined) {
      throw new Error(`no such handler: '${handlerName}'`)
    }

    if (component.kind === "Command") {
      // lookup table to map `__typename` to the static `DomainEvent` class.
      const domainEventLookupTable = component.events
        .map(eventType => ({
          [eventType.__typename]: eventType,
        }))
        .reduce((a, b) => ({ ...a, ...b }), {})

      const tableName = process.env["EVENT_STORE_TABLE"]
      if (tableName === undefined) {
        throw new Error("missing environment variable: EVENT_STORE_TABLE")
      }
      const source = component.store.stateShape.name

      this.handler = memoize(context => {
        const command = component.init(context)

        return createHandler(async event => {
          if (log_level === "debug") {
            console.log(JSON.stringify({ event }, null, 2))
          }

          const commandResponse = await command(
            event,
            connectStoreInterface({
              eventStore: tableName,
              source,
              initialState: component.store.initialState,
              reducer: component.store.reducer,
            }),
          )

          if (log_level === "debug") {
            console.log(JSON.stringify({ commandResponse }, null, 2))
          }

          const events = (Array.isArray(commandResponse) ? commandResponse : commandResponse.events).map(
            eventInstance => {
              const event = domainEventLookupTable[eventInstance.__typename]
              if (event === undefined) {
                throw new Error("FUCK")
              }
              return new DomainEventEnvelope({
                source,
                source_id: eventInstance[event.__key],
                payload: eventInstance,
              })
            },
          )
          const confirmation = Array.isArray(commandResponse) ? undefined : commandResponse.confirmation ?? events

          await Promise.all(
            events.map(async evt => {
              await storeEvent(tableName, evt)
            }),
          )
          if (log_level === "debug") {
            console.log(JSON.stringify({ events }, null, 2))
            console.log(JSON.stringify({ confirmation }, null, 2))
          }
          return undefined
        })
      })
    } else if (component.kind === "EventHandler") {
    } else if (component.kind === "ReadModel") {
      this.handler = memoize(context => {
        const projection = component.init(getConfiguration(component.config) as any, context)
        return createHandler(async (event: SQSEvent, context: Context) => {
          if (log_level === "debug") {
            console.log(JSON.stringify({ event }, null, 2))
          }
          await Promise.all(event.Records.map(record => projection(JSON.parse(record.body), context)))
        })
      })
    } else if (component.kind === "Policy") {
      this.handler = memoize(context => {
        const commands = initCommands(component.commands, names, this.lambda)
        const readModels = initReadModels(component.reads, context)
        const policy = component.init(context)

        return createHandler(async (event: SQSEvent, context: Context) => {
          if (log_level === "debug") {
            console.log(JSON.stringify({ event }, null, 2))
          }
          await Promise.all(event.Records.map(record => policy(JSON.parse(record.body), commands, readModels, context)))
        })
      })
    } else if (component.kind === "Query") {
      this.handler = memoize(context => {
        const query = component.init(initReadModels(component.readModels, context), context)

        return createHandler((event: any, context: any) => query(event /* TODO: deserialization */, context))
      })
    }

    /**
     * Wraps a Handler Function, F, in a metricScope with default metrics behavior specific to event storming.
     *
     * @param eventHandler the user-defined event handler
     * @returns a wrapped eventHandler that includes metrics
     */
    function createHandler<F extends (...args: any[]) => Promise<any>>(eventHandler: F): F {
      return metricScope(metrics => {
        metrics.putDimensions({
          ComponentKind: component.kind,
          ComponentName: componentName,
        })

        return async args => {
          const startTime = new Date()

          try {
            const result = await eventHandler(args)
            metrics.putMetric("Failure", 0, Unit.Count)
            metrics.putMetric("Success", 1, Unit.Count)
            return result
          } catch (err) {
            console.error(err)
            metrics.putMetric("Failure", 1, Unit.Count)
            metrics.putMetric("Success", 0, Unit.Count)
          } finally {
            const endTime = new Date()
            metrics.putMetric("Latency", endTime.getTime() - startTime.getTime(), Unit.Milliseconds)
          }
        }
      }) as F
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
              Payload: new TextEncoder().encode(JSON.stringify(input)),
            }),
          ),
      }
    })
    .reduce((a, b) => ({ ...a, ...b }), {})
}

function initReadModels(readModels: Record<string, ReadModel>, context: any) {
  return Object.entries(readModels)
    .map(([key, readModel]) => {
      return {
        [key]: readModel.client(getConfiguration(readModel.config), context),
      }
    })
    .reduce((a, b) => ({ ...a, ...b }), {})
}

function getConfiguration(dependencies: Config[]) {
  return dependencies
    .map(dependency => {
      const dep = process.env[`DEPENDENCY_${dependency.name}`]
      if (!dep) {
        throw new Error(`The dependency DEPENDENCY_${dependency.name} is missing.`)
      }
      return {
        [dependency.name]: JSON.parse(dep),
      }
    })
    .reduce((a, b) => ({ ...a, ...b }), {}) as any
}
