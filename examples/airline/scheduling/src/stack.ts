import * as cdk from "@aws-cdk/core";

import { scheduling } from "./service";
import { EventStormConstruct } from "stochastic/lib/cjs/infrastructure";

export class SchedulingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new EventStormConstruct(this, "SchedulingEventStorm", {
      storm: scheduling,
    });
  }
}

const app = new cdk.App();
new SchedulingStack(app, "Scheduling");
