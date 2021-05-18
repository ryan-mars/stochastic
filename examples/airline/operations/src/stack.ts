import * as cdk from "@aws-cdk/core";

import { BoundedContextConstruct, ReceiveEventBridgeEventBinding } from "stochastic-aws-serverless";
import { operations, } from "./service";
import { scheduling, ScheduledFlightsAdded } from "scheduling";

export class SchedulingStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>;
  readonly scheduling: BoundedContextConstruct<typeof scheduling>;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.operations = new BoundedContextConstruct(this, "SchedulingBoundedContext", {
      boundedContext: operations,
      //      receiveEvents: [new ReceiveEventBridgeEventBinding({ events: [ScheduledFlightsAdded], eventBridgeArn: "" })]
    });
  }
}

const app = new cdk.App();
new SchedulingStack(app, "Scheduling");
