import * as cdk from "@aws-cdk/core"
import * as lambda from "@aws-cdk/aws-lambda"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import { BoundedContext, Query, ReadModel } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { generateHandler } from "./code-gen"
import { ComponentConstruct, ComponentConstructProps } from "./component-construct"
import { ConfigBinding, ConfigBindings } from "./config-binding"
import { ReadModelBindings } from "./read-model-binding"

// export interface QueryConstructProps {
//   dependencies: Map<string, DependencyConstruct>
// }

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface QueryConstructProps<Q extends Query = Query>
  extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {
  dependencies: Record<string, ConfigBinding>
}

export class QueryConstruct<
  S extends BoundedContext = BoundedContext,
  Q extends Query = Query
> extends ComponentConstruct<S, Q> {
  readonly handler: lambda.Function
  constructor(
    scope: BoundedContextConstruct,
    id: string,
    props: QueryConstructProps<Q> & ComponentConstructProps<S, Q>
  ) {
    super(scope, id, props)

    this.handler = new nodeLambda.NodejsFunction(this, "Function", {
      functionName: `${props.boundedContext.name}-${this.name}`,
      ...generateHandler(this.name, props.component, props.boundedContext.componentNames),
      ...props,
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        COMPONENT_NAME: this.name
      },
      bundling: {
        sourceMap: true,
        metafile: true
      }
    })

    new ReadModelBindings(this, "ReadModelBindings", {
      context: scope,
      handler: this.handler,
      readModels: props.component.readModels
    })
  }
}
