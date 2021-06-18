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
import { Duration } from "@aws-cdk/core"

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
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
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
      components: {
        rebookingOptionsReadModel: {
          timeout: Duration.seconds(30),
          environment: {
            LOG_LEVEL: "debug",
          },
        },
        rebookingPolicy: {
          timeout: Duration.seconds(30),
          environment: {
            LOG_LEVEL: "debug",
          },
        },
      },
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

    // TODO Fix types so you can access resources on the node
    // this.reservations.components.rebookingPolicy.node

    // Clean up when the stack is deleted since this is just an example app.
    this.reservations.eventStore.table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
    table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}

const app = new cdk.App()
new ReservationStack(app, "Reservations")
