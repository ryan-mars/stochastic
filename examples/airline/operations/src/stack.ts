import * as cdk from "@aws-cdk/core"

import * as sdk from "stochastic-aws-serverless"
import { FlightCancelled, operations } from "./service"
import { scheduling, ScheduledFlightsAdded } from "scheduling"
import { EventBus } from "@aws-cdk/aws-events"

export class OperationsStack extends cdk.Stack {
  readonly operations: sdk.BoundedContextConstruct<typeof operations>
  readonly scheduling: sdk.BoundedContextConstruct<typeof scheduling>
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

    this.operations = new sdk.BoundedContextConstruct(this, "OperationsBoundedContext", {
      boundedContext: operations,
      receiveEvents: [
        new sdk.ReceiveEventBridgeEventBinding({
          otherBoundedContext: scheduling,
          events: [ScheduledFlightsAdded],
          eventBus,
        }),
      ],
      emitEvents: [
        new sdk.EmitEventBridgeBinding({
          events: [FlightCancelled],
          eventBus,
        }),
      ],
      config: {},
    })
    // Destroy this table when the stack is destroyed since this is just an example app.
    this.operations.eventStore.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}
