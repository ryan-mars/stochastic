import * as lambda from "aws-lambda"

import { Credentials } from "@aws-sdk/types"
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import {
  Command,
  Config,
  DomainEventEnvelope,
  EnvironmentVariables,
  getEnv,
  getLogLevel,
  Init,
  LogLevel,
  ReadModel,
} from "stochastic"
import { Context, SQSEvent } from "aws-lambda"
import { Component } from "stochastic"
import { connectStoreInterface, storeEvent } from "./event-store"
import { TextEncoder } from "util"

import { Configuration, metricScope, MetricsLogger, Unit } from "aws-embedded-metrics"

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
    const logLevel = getLogLevel() ?? LogLevel.Debug
    const boundedContextName = getEnv(EnvironmentVariables.BoundedContextName)
    const handlerName = getEnv(EnvironmentVariables.ComponentName) // TODO: is this ever different than the passed in `componentName`?

    // Configuration.serviceName = boundedContextName // what is this used for?
    Configuration.namespace = boundedContextName

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

      const tableName = getEnv(EnvironmentVariables.EventStoreTableName)
      const source = component.store.stateShape.name

      this.handler = memoize(context => {
        const command = component.init(context)

        return createHandler(metrics => async event => {
          if (logLevel === LogLevel.Debug) {
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

          if (logLevel === LogLevel.Debug) {
            console.log(JSON.stringify({ commandResponse }, null, 2))
          }

          const events = (Array.isArray(commandResponse) ? commandResponse : commandResponse.events).map(
            eventInstance => {
              const event = domainEventLookupTable[eventInstance.__typename]
              metrics.putMetric(`Emit${eventInstance.__typename}`, 1, Unit.Count)
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
          if (logLevel === LogLevel.Debug) {
            console.log(JSON.stringify({ events }, null, 2))
            console.log(JSON.stringify({ confirmation }, null, 2))
          }
          return confirmation
        })
      })
    } else if (component.kind === "EventHandler") {
      // Todo
    } else if (component.kind === "ReadModel") {
      this.handler = memoize(context => {
        const projection = component.init(getConfiguration(component.config) as any, context)
        return createHandler(metrics => async (event: SQSEvent, context: Context) => {
          if (logLevel === LogLevel.Debug) {
            console.log(JSON.stringify({ event }, null, 2))
          }
          await Promise.all(event.Records.map(record => projection(JSON.parse(record.body), context)))
        })
      })
    } else if (component.kind === "Policy") {
      this.handler = memoize(context => {
        const readModels = initReadModels(component.reads, context)
        const policy = component.init(context)

        return createHandler(metrics => async (event: SQSEvent, context: Context) => {
          const commands = initCommands(component.commands, names, this.lambda, metrics)
          if (logLevel === LogLevel.Debug) {
            console.log(JSON.stringify({ event }, null, 2))
          }
          await Promise.all(
            event.Records.map(record => {
              const event: DomainEventEnvelope = JSON.parse(record.body)
              return instrumentAction(() => policy(event, commands, readModels, context), {
                metrics,
                name: event.type,
              })
            }),
          )
        })
      })
    } else if (component.kind === "Query") {
      this.handler = memoize(context => {
        const query = component.init(initReadModels(component.readModels, context), context)

        return createHandler(metrics => (event: any, context: any) => query(event /* TODO: deserialization */, context))
      })
    }

    /**
     * Wraps a Handler Function, F, in a metricScope with default metrics behavior specific to event storming.
     *
     * @param eventHandler the user-defined event handler
     * @returns a wrapped eventHandler that includes metrics
     */
    function createHandler<F extends (...args: any[]) => Promise<any>>(eventHandler: (metrics: MetricsLogger) => F): F {
      return metricScope(metrics => {
        metrics.putDimensions({
          ComponentKind: component.kind,
          ComponentName: componentName,
        })

        return eventHandler(metrics)
      }) as F
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

async function instrumentAction<T>(
  f: () => Promise<T>,
  props: {
    metrics: MetricsLogger
    name: string
    prefix?: string
    suffix?: string
  },
): Promise<T> {
  const name = `${props.prefix ?? ""}${props.name}${props.suffix ?? ""}`
  const startTime = new Date()

  try {
    const result = await f()
    props.metrics.putMetric(`${name}Failure`, 0, Unit.Count)
    props.metrics.putMetric(`${name}Success`, 1, Unit.Count)
    return result
  } catch (err) {
    console.error(err)
    props.metrics.putMetric(`${name}Failure`, 1, Unit.Count)
    props.metrics.putMetric(`${name}Success`, 0, Unit.Count)
    throw err
  } finally {
    const endTime = new Date()
    props.metrics.putMetric(`${name}Latency`, endTime.getTime() - startTime.getTime(), Unit.Milliseconds)
  }
}

function initCommands(
  commands: Record<string, Command>,
  names: Map<Component, string>,
  lambda: LambdaClient,
  metrics: MetricsLogger,
) {
  return Object.entries(commands as Record<string, Command>)
    .map(([key, command]) => {
      const commandName = names.get(command)!
      const lambdaArn = getEnv(`${commandName}_LAMBDA_ARN`)

      return {
        [key]: async (input: any) =>
          instrumentAction(
            () =>
              lambda.send(
                new InvokeCommand({
                  FunctionName: lambdaArn,
                  Payload: new TextEncoder().encode(JSON.stringify(input)),
                }),
              ),
            {
              metrics,
              name: commandName,
              prefix: "Invoke",
            },
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
