import * as cdk from "@aws-cdk/core"
import * as ddb from "@aws-cdk/aws-dynamodb"
import { EventBus } from "@aws-cdk/aws-events"

import { reservations } from "./service"
import { operations, FlightCancelled } from "operations"
import {
  BoundedContextConstruct,
  ReceiveEventBridgeEventBinding,
  DynamoDBConfigBinding,
} from "stochastic-aws-serverless"
import { ScheduledFlightsAdded, ScheduledFlightsRemoved, ScheduledRouteAdded, scheduling } from "scheduling"

export class ReservationStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>
  readonly reservations: BoundedContextConstruct<typeof reservations>
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

    const table = new ddb.Table(this, "SingleTable", {
      partitionKey: {
        name: "pk",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: ddb.AttributeType.STRING,
      },
    })
    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: {
        name: "gsi1pk",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi1sk",
        type: ddb.AttributeType.STRING,
      },
    })

    this.reservations = new BoundedContextConstruct(this, "BoundedContext", {
      boundedContext: reservations,
      receiveEvents: [
        new ReceiveEventBridgeEventBinding({
          otherBoundedContext: scheduling,
          events: [ScheduledFlightsAdded, ScheduledFlightsRemoved],
          eventBus,
        }),
        new ReceiveEventBridgeEventBinding({
          otherBoundedContext: operations,
          events: [FlightCancelled],
          eventBus,
        }),
      ],
      config: {
        SingleTable: new DynamoDBConfigBinding(table),
      },
    })

    // Destroy this table when the stack is destroyed since this is just an example app.
    this.reservations.eventStore.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}

const app = new cdk.App()
new ReservationStack(app, "Reservations")
