import * as cdk from "@aws-cdk/core"
import * as lambda from "@aws-cdk/aws-lambda"
import { ReadModel } from "stochastic"
import { ConfigBindings } from "./config-binding"
import { BoundedContextConstruct } from "./bounded-context-construct"

export interface ReadModelBindingsProps<ReadModels extends Record<string, ReadModel>> {
  context: BoundedContextConstruct
  readModels: ReadModels
  handler: lambda.Function
}

export class ReadModelBindings<ReadModels extends Record<string, ReadModel>> extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ReadModelBindingsProps<ReadModels>) {
    super(scope, id)

    for (const [key, model] of Object.entries(props.readModels)) {
      new ConfigBindings(this, key, {
        config: model.config,
        context: props.context,
        handler: props.handler,
      })
    }
  }
}
