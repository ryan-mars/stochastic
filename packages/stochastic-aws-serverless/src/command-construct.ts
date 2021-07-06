import * as lambda from "@aws-cdk/aws-lambda"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import { BoundedContext, Command, EnvironmentVariables } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { generateHandler } from "./code-gen"
import { ComponentConstruct, ComponentConstructProps, ComponentProps } from "./component-construct"

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface CommandConstructProps<C extends Command = Command>
  extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {
  runtime?: lambda.Runtime
}

export class CommandConstruct<
  S extends BoundedContext = BoundedContext,
  C extends Command = Command,
> extends ComponentConstruct<S, C> {
  readonly handler: lambda.Function
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<C> & ComponentConstructProps<S, C>) {
    super(scope, id, props)

    this.handler = new nodeLambda.NodejsFunction(this, "Function", {
      functionName: `${props.boundedContext.name}-${this.name}`,
      ...generateHandler(this.name, props.component, props.boundedContext.componentNames),
      runtime: lambda.Runtime.NODEJS_14_X,
      ...props,
      environment: {
        [EnvironmentVariables.BoundedContextName]: scope.boundedContext.name,
        [EnvironmentVariables.ComponentName]: this.name,
        // TODO: use SSM instead of environment variables
        [EnvironmentVariables.EventStoreTableName]: scope.eventStore.table.tableName,
      },
      bundling: {
        sourceMap: true,
        metafile: true,
      },
    })
    scope.eventStore.table.grant(
      this.handler,
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    )
  }
}
