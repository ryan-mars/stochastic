import * as cdk from "@aws-cdk/core";

import { BoundedContextConstruct, ReceiveEventBridgeEventBinding, EmitEventBridgeBinding } from "stochastic-aws-serverless";
import { scheduling, operations, FlightCancelledEvent } from "./service";

export class SchedulingStack extends cdk.Stack {
  readonly scheduling: BoundedContextConstruct<typeof scheduling>;
  readonly operations: BoundedContextConstruct<typeof operations>;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.scheduling = new BoundedContextConstruct(this, "SchedulingBoundedContext", {
      boundedContext: scheduling,

    });

    this.operations = new BoundedContextConstruct(this, "Operators", {
      boundedContext: operations,
      emitEvents: [
        new EmitEventBridgeBinding({
          account: "",
          events: [
            FlightCancelledEvent
          ]
        })
      ],
      receiveEvents: []
    });

    this.operations.emitEvent(new EmitEventBridgeBinding({
      account: "abcdef",
      events: [
        FlightCancelledEvent
      ]
    }));

    this.scheduling.receiveEvent(new ReceiveEventBridgeEventBinding({
      eventBridgeArn: "blah",
      events: [
        FlightCancelledEvent,
      ]
    }));
  }
}

const app = new cdk.App();
new SchedulingStack(app, "Scheduling");
