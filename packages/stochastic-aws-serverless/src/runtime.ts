import * as lambda from "aws-lambda";

import * as AWS from "aws-sdk";
import { CommandInterface } from "stochastic";
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
      // what the is the ARN of dynamodb

      const agg = component.aggregate;
      this.handler = async (event) => {
        console.log(event);
        console.log(component.aggregate.stateType.__typename);
        console.log(component.aggregate.stateKey);

        // TODO: command response type is too vague to work with
        const commandResponse = await component.execute(
          event,
          connectAggregateInterface(
            "",
            component.aggregate.stateType.__typename,
            component.aggregate.initialState,
            component.aggregate.reducer,
          ),
        );
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
