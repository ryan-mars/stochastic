import * as cdk from "@aws-cdk/core";

import { BoundedContextConstruct, ReceiveEventBridgeEventBinding } from "stochastic-aws-serverless";
import { operations, } from "./service";
import { scheduling, ScheduledFlightsAdded } from "scheduling";
import { EventBus } from "@aws-cdk/aws-events";

export class OperationsStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>;
  readonly scheduling: BoundedContextConstruct<typeof scheduling>;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const eventBus = EventBus.fromEventBusArn(scope, "DefaultEventBus", this.formatArn({
    //   service: "events",
    //   resource: "event-bus",
    //   sep: "/",
    //   resourceName: "default"
    // }))

    const eventBus = EventBus.fromEventBusArn(this, "DefaultEventBus", 'arn:aws:events:us-east-2:611181767269:event-bus/default')


    this.operations = new BoundedContextConstruct(this, "OperationsBoundedContext", {
      boundedContext: operations,
      receiveEvents: [new ReceiveEventBridgeEventBinding({ otherBoundedContext: scheduling, events: [ScheduledFlightsAdded], eventBus })]
    });
  }
}

const app = new cdk.App();
new OperationsStack(app, "Operations", { description: "Flight Operations service" });
