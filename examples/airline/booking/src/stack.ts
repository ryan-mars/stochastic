import * as cdk from "@aws-cdk/core";

import { booking } from "./service";
import { EventStormConstruct } from "stochastic/lib/cjs/infrastructure";

export class BookingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new EventStormConstruct(this, "EventStorm", {
      storm: booking,
    });
  }
}

const app = new cdk.App();
new BookingStack(app, "Booking");
