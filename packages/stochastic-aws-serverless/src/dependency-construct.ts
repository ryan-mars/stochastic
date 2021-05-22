import * as dynamodb from "@aws-cdk/aws-dynamodb"
import * as iam from "@aws-cdk/aws-iam"

export interface DependencyConstruct {
  readonly resourceId: string
  bind(grantable: iam.IGrantable): void
}

export class DynamoDBDependency implements DependencyConstruct {
  readonly resourceId: string
  constructor(readonly table: dynamodb.Table, readonly access: "read" | "write" | "read-write" = "read-write") {
    this.resourceId = table.tableArn
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
