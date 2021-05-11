import * as lambda from "aws-lambda";

import * as AWS from "aws-sdk";
import { CommandInterface, DomainEventEnvelope } from "stochastic";
import { SQSEvent } from "aws-lambda";
import { Component } from "stochastic";
import { connectAggregateInterface } from "./event-store";

export interface RuntimeOptions {
  credentials?: AWS.Credentials;
}

export interface Runtime {
  readonly component: Component;
  readonly handler: lambda.Handler;
}

export class LambdaRuntime implements Runtime {
  readonly lambda: AWS.Lambda;
  readonly handler: lambda.Handler;
  constructor(
    readonly component: Component,
    readonly componentName: string,
    readonly names: Map<Component, string>,
    options?: RuntimeOptions,
  ) {
    this.lambda = new AWS.Lambda(options?.credentials);

    const handlerName = process.env.COMPONENT_NAME;
    if (handlerName === undefined) {
      throw new Error(`environment variable not set: 'COMPONENT_NAME'`);
    }

    if (component === undefined) {
      throw new Error(`no such handler: '${handlerName}'`);
    }

    if (component.kind === "Command") {
      this.handler = async (event) => {
        console.log({ event });
        console.log(JSON.stringify({ component }, null, 2));
        console.log({ aggregate: component.aggregate });

        const tableName = process.env["EVENT_STORE_TABLE"];
        if (tableName === undefined) {
          throw new Error("missing environment variable: EVENT_STORE_TABLE");
        }

        const { initialState, reducer } = component.aggregate;
        const source = component.aggregate.stateShape.name;

        // TODO: command response type is too vague to work with
        const commandResponse = await component.execute(
          event,
          connectAggregateInterface({
            eventStore: tableName,
            source,
            initialState,
            reducer,
          }),
        );
        console.log(JSON.stringify({ commandResponse }, null, 2));

        let events;
        let confirmation;

        if (Array.isArray(commandResponse)) {
          confirmation = events = commandResponse.map((o) => new DomainEventEnvelope({ source, source_id: "???", payload: o }));
        } else {
          events = commandResponse.events.map((o) => new DomainEventEnvelope({ source, source_id: "???", payload: o }));
          confirmation = commandResponse.confirmation ?? events;
        }

        console.log(JSON.stringify({ events }, null, 2));
        console.log(JSON.stringify({ confirmation }, null, 2));
        return confirmation;
      };
    } else if (component.kind === "ReadModel") {
    } else if (component.kind === "Policy") {
      // where
      const commands = component.commands.map((command) => {
        const commandName = names.get(command)!;
        const lambdaArn = process.env[`${commandName}_LAMBDA_ARN`];
        if (lambdaArn === undefined) {
          throw new Error(`missing environment variable: '${commandName}_LAMBDA_ARN'`);
        }
        return (input: any) =>
          this.lambda
            .invoke({
              FunctionName: lambdaArn,
              Payload: JSON.stringify(input),
            })
            .promise();
      }) as CommandInterface<typeof component["commands"]>;
      this.handler = (event: SQSEvent, context) =>
        Promise.all(event.Records.map((record) => component.apply(JSON.parse(record.body), ...commands)));
    }
  }
}
