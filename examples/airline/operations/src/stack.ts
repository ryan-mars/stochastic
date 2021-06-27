import * as cdk from "@aws-cdk/core"

import {
  BoundedContextConstruct,
  EmitEventBridgeBinding,
  ReceiveEventBridgeEventBinding,
} from "stochastic-aws-serverless"
import { FlightArrived, FlightCancelled, operations } from "./service"
import { scheduling, ScheduledFlightsAdded } from "scheduling"
import { EventBus } from "@aws-cdk/aws-events"

export class OperationsStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>
  readonly scheduling: BoundedContextConstruct<typeof scheduling>
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

    this.operations = new BoundedContextConstruct(this, "OperationsBoundedContext", {
      boundedContext: operations,
      // receiveEvents: [
      //   new ReceiveEventBridgeEventBinding({
      //     otherBoundedContext: scheduling,
      //     events: [ScheduledFlightsAdded],
      //     eventBus,
      //   }),
      // ],
      emitEvents: [new EmitEventBridgeBinding({ events: [FlightCancelled, FlightArrived], eventBus })],
      config: {},
    })
    // Destroy this table when the stack is destroyed since this is just an example app.
    this.operations.eventStore.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}

const app = new cdk.App()
new OperationsStack(app, "Operations", { description: "Flight Operations service" })
