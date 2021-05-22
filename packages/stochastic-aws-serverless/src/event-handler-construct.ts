import * as lambda from "@aws-cdk/aws-lambda"
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import * as sns from "@aws-cdk/aws-sns"
import * as snsSubscriptions from "@aws-cdk/aws-sns-subscriptions"
import * as sqs from "@aws-cdk/aws-sqs"
import { BoundedContext, EventHandler, ReadModel } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { generateHandler } from "./code-gen"
import { ComponentConstruct, ComponentConstructProps } from "./component-construct"
import { DependencyConstruct } from "./dependency-construct"

// export interface EventHandlerConstructProps {
//   dependencies: Map<string, DependencyConstruct>
// }

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface EventHandlerConstructProps<P extends EventHandler | ReadModel = EventHandler | ReadModel>
  extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {
  dependencies: Map<string, DependencyConstruct>
}

export class EventHandlerConstruct<
  S extends BoundedContext = BoundedContext,
  C extends EventHandler | ReadModel = EventHandler | ReadModel
> extends ComponentConstruct<S, C> {
  readonly handler: lambda.Function
  constructor(
    scope: BoundedContextConstruct,
    id: string,
    props: EventHandlerConstructProps<C> & ComponentConstructProps<S, C>
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

    for (const dependency of props.component.dependencies) {
      const depConstruct = props.dependencies.get(dependency.name)
      if (depConstruct === undefined) {
        throw new Error(`cannot find dependency: '${dependency.name}'`)
      }

      depConstruct.bind(this.handler)
      this.handler.addEnvironment(`DEPENDENCY_${dependency.name}`, depConstruct.resourceId)
    }

    const queue = new sqs.Queue(this, `Queue`)
    this.handler.addEventSource(new lambdaEventSources.SqsEventSource(queue))
    scope.eventStore.topic.addSubscription(
      new snsSubscriptions.SqsSubscription(queue, {
        rawMessageDelivery: true,
        filterPolicy: {
          event_type: sns.SubscriptionFilter.stringFilter({
            whitelist: this.component.events.map(e => e.name)
          })
        }
      })
    )
  }
}
