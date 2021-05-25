import path from "path"
import fs from "fs"
import { Command, Component, EventHandler, Policy, Query, ReadModel } from "stochastic"

export function generateHandler(
  componentName: string,
  component: Policy | Command | ReadModel | Query | EventHandler,
  componentNames: Map<Component, string>
): {
  entry: string
  handler: string
} {
  fs.mkdirSync("stochastic.out", { recursive: true })
  const entry = path.resolve("stochastic.out", componentName + ".ts")
  fs.writeFileSync(
    entry,
    `import { LambdaRuntime } from "stochastic-aws-serverless/lib/runtime";    
import { ${componentName} } from "${requirePath(component)}";

${
  component.kind === "Policy"
    ? Object.values(component.commands as Record<string, Command>)
        .map(command => `import {${componentNames.get(command)!}} from "${requirePath(command)}"`)
        .join("\n")
    : ""
}
const names = new Map<any, any>();
${
  component.kind === "Policy"
    ? Object.values(component.commands as Record<string, Command>)
        .map(command => `names.set(${componentNames.get(command)!}, "${componentNames.get(command)!}");`)
        .join("\n")
    : ""
}
const runtime = new LambdaRuntime(${componentName}, "${componentName}", names);
let _handler: any;
export const handler = async (event: any, context: any) => {
  if (_handler === undefined) {
    _handler = runtime.handler(context)
  }
  return _handler(event, context)
}
`
  )
  return {
    entry,
    handler: "handler"
  }

  function requirePath(component: Policy | Command | ReadModel | Query | EventHandler): string {
    return path.relative(path.dirname(entry), component.filename).replace(".ts", "")
  }
}
