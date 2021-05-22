import * as cdk from "@aws-cdk/core"
import { EventBus } from "@aws-cdk/aws-events"

import { reservations } from "./service"
import { operations, FlightCancelled } from "operations/lib/service"
import { BoundedContextConstruct } from "stochastic-aws-serverless/lib/infrastructure"
import { ReceiveEventBridgeEventBinding } from "stochastic-aws-serverless"

export class ReservationStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const eventBus = EventBus.fromEventBusArn(
      this,
      "DefaultEventBus",
      this.formatArn({
        service: "events",
        resource: "event-bus",
        sep: "/",
        resourceName: "default"
      })
    )

    new BoundedContextConstruct(this, "BoundedContext", {
      boundedContext: reservations,
      receiveEvents: [
        new ReceiveEventBridgeEventBinding({
          otherBoundedContext: operations,
          events: [FlightCancelled],
          eventBus
        })
      ]
    })
  }
}

const app = new cdk.App()
new ReservationStack(app, "Reservations")
