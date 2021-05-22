import * as lambda from "@aws-cdk/aws-lambda"
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import * as sns from "@aws-cdk/aws-sns"
import * as snsSubscriptions from "@aws-cdk/aws-sns-subscriptions"
import * as sqs from "@aws-cdk/aws-sqs"
import { BoundedContext, Policy } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { generateHandler } from "./code-gen"
import { CommandConstruct } from "./command-construct"
import { ComponentConstruct, ComponentConstructProps, ComponentProps } from "./component-construct"

export interface PolicyConstructProps {
  commands: Map<string, CommandConstruct>
}

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface PolicyConstructProps<P extends Policy = Policy>
  extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {}

export class PolicyConstruct<
  S extends BoundedContext = BoundedContext,
  C extends Policy = Policy
> extends ComponentConstruct<S, C> {
  readonly handler: lambda.Function
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<C> & ComponentConstructProps<S, C>) {
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

    for (const command of props.component.commands) {
      const commandName = props.boundedContext.componentNames.get(command)!
      const commandConstruct = props.commands.get(commandName)!

      this.handler.addEnvironment(
        `${props.boundedContext.componentNames.get(command)!}_LAMBDA_ARN`,
        commandConstruct?.handler.functionArn!
      )
      commandConstruct.handler.grantInvoke(this.handler)
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
    scope.eventStore.table.grantWriteData(this.handler)
    /**
     * Allow policy to invoke commands
     */
    for (const command of this.component.commands) {
      ;(scope.componentMap.get(command) as CommandConstruct).handler.grantInvoke(this.handler)
    }
  }
}
