import * as cdk from "@aws-cdk/core";

import { scheduling } from "./service";
import { BoundedContextConstruct } from "stochastic-aws-serverless/lib/cjs/infrastructure";

export class SchedulingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new BoundedContextConstruct(this, "SchedulingBoundedContext", {
      boundedContext: scheduling,
    });
  }
}

const app = new cdk.App();
new SchedulingStack(app, "Scheduling");
