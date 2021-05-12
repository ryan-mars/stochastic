import * as cdk from "@aws-cdk/core";

import { booking } from "./service";
import { BoundedContextConstruct } from "stochastic-aws-serverless/lib/cjs/infrastructure";

export class BookingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new BoundedContextConstruct(this, "BoundedContext", {
      storm: booking,
    });
  }
}

const app = new cdk.App();
new BookingStack(app, "Booking");
