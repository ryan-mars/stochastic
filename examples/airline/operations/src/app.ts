import * as cdk from "@aws-cdk/core"
import * as sdk from "stochastic-aws-serverless"

import { OperationsStack } from "./stack"

const app = new cdk.App()
const opsStack = new OperationsStack(app, "Operations", {
  description: "Flight Operations service",
})

const monitoring = new sdk.BoundedContextMonitoring(app, "OperationsMonitoring", {
  context: opsStack.operations,
})
