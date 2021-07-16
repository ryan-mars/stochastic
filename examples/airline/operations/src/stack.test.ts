import * as cdk from "@aws-cdk/core"
import * as sdk from "stochastic-aws-serverless"

import * as path from "path"

import { OperationsStack } from "./stack"

test("should synthesize operations and monitoring stack", () => {
  const cwd = process.cwd()
  process.chdir(path.join(__dirname, ".."))
  try {
    const app = new cdk.App({
      autoSynth: false,
    })
    const opsStack = new OperationsStack(app, "Operations", {
      description: "Flight Operations service",
    })

    const monitoring = new sdk.BoundedContextMonitoring(app, "OperationsMonitoring", {
      context: opsStack.operations,
    })
  } finally {
    process.chdir(cwd)
  }
})
