import { EventBus } from "@aws-cdk/aws-events";
import * as cdk from "@aws-cdk/core";

import { BoundedContextConstruct, EmitEventBridgeBinding } from "stochastic-aws-serverless";
import { ScheduledFlightsAdded, scheduling, } from "./service";

export class SchedulingStack extends cdk.Stack {
  readonly scheduling: BoundedContextConstruct<typeof scheduling>;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log(this.formatArn({
      service: "events",
      resource: "event-bus",
      sep: "/",
      resourceName: "default"
    }))

    const eventBus = EventBus.fromEventBusArn(this, "DefaultEventBus", 'arn:aws:events:us-east-2:611181767269:event-bus/default')

    this.scheduling = new BoundedContextConstruct(this, "SchedulingBoundedContext", {
      boundedContext: scheduling,
      emitEvents: [new EmitEventBridgeBinding({ events: [ScheduledFlightsAdded], eventBus })]
    });
  }
}
const app = new cdk.App();
new SchedulingStack(app, "Scheduling", { description: "Flight Scheduling service" });
