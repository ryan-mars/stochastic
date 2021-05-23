import * as lambda from "@aws-cdk/aws-lambda"
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import * as sns from "@aws-cdk/aws-sns"
import * as snsSubscriptions from "@aws-cdk/aws-sns-subscriptions"
import * as sqs from "@aws-cdk/aws-sqs"
import { BoundedContext, Query, ReadModel } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { generateHandler } from "./code-gen"
import { ComponentConstruct, ComponentConstructProps } from "./component-construct"
import { DependencyConstruct } from "./dependency-construct"

// export interface QueryConstructProps {
//   dependencies: Map<string, DependencyConstruct>
// }

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface QueryConstructProps<Q extends Query = Query>
  extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {
  dependencies: Record<string, DependencyConstruct>
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

    for (const model of props.component.models) {
      for (const dependency of model.dependencies) {
        const depConstruct = props.dependencies[dependency.name]
        if (depConstruct === undefined) {
          throw new Error(`cannot find dependency: '${dependency.name}'`)
        }

        depConstruct.bind(this.handler)
        this.handler.addEnvironment(`DEPENDENCY_${dependency.name}`, depConstruct.resourceId)
      }
    }
  }
}
