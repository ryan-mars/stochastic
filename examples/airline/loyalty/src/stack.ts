import * as cdk from "@aws-cdk/core"
import { loyalty } from "./service"
import { FlightArrived, operations } from "operations"
import { EventBus } from "@aws-cdk/aws-events"
import {
  BoundedContextConstruct,
  EmitEventBridgeBinding,
  ReceiveEventBridgeEventBinding,
} from "stochastic-aws-serverless"

const app = new cdk.App()

export class LoyaltyStack extends cdk.Stack {
  readonly loyalty: BoundedContextConstruct<typeof loyalty>
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const eventBus = EventBus.fromEventBusArn(
      this,
      "DefaultEventBus",
      this.formatArn({
        service: "events",
        resource: "event-bus",
        sep: "/",
        resourceName: "default",
      }),
    )

    this.loyalty = new BoundedContextConstruct(this, "LoyaltyBoundedContext", {
      boundedContext: loyalty,
      receiveEvents: [
        new ReceiveEventBridgeEventBinding({
          otherBoundedContext: operations,
          events: [FlightArrived],
          eventBus,
        }),
      ],
      // emitEvents: [new EmitEventBridgeBinding({ events: [...], eventBus })],
      config: {},
    })
    // Destroy this table when the stack is destroyed since this is just an example app.
    this.loyalty.eventStore.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}

new cdk.Stack(app, "loyalty")
