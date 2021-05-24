import * as cdk from "@aws-cdk/core"
import * as dynamodb from "@aws-cdk/aws-dynamodb"
import * as lambda from "@aws-cdk/aws-lambda"
import * as iam from "@aws-cdk/aws-iam"
import { Config, TableConfig } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"

export interface ConfigBinding<T = any> {
  readonly data: T
  bind(grantable: iam.IGrantable): void
}

export class DynamoDBConfigBinding implements ConfigBinding<TableConfig> {
  readonly data: TableConfig
  constructor(readonly table: dynamodb.Table, readonly access: "read" | "write" | "read-write" = "read-write") {
    this.data = new TableConfig({
      tableArn: table.tableArn,
      tableName: table.tableName
    })
  }
  public bind(grantable: iam.IGrantable): void {
    if (this.access === "read") {
      this.table.grantReadData(grantable)
    } else if (this.access === "write") {
      this.table.grantWriteData(grantable)
    } else if (this.access === "read-write") {
      this.table.grantReadWriteData(grantable)
    }
  }
}

export interface ConfigBindingsProps {
  context: BoundedContextConstruct
  config: Config[]
  handler: lambda.Function
}

export class ConfigBindings extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ConfigBindingsProps) {
    super(scope, id)
    for (const config of props.config) {
      const configConstruct = props.context.config[config.name as keyof typeof props.context.config] as ConfigBinding
      if (configConstruct === undefined) {
        throw new Error(`cannot find configuration: '${config.name}'`)
      }

      configConstruct.bind(props.handler)

      props.handler.addEnvironment(`DEPENDENCY_${config.name}`, JSON.stringify(configConstruct.data))
    }
  }
}
