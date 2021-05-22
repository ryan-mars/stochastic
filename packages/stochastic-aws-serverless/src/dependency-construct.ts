import * as dynamodb from "@aws-cdk/aws-dynamodb"
import * as iam from "@aws-cdk/aws-iam"

export interface DependencyConstruct {
  readonly resourceId: string
  bind(grantable: iam.IGrantable): void
}

export class DynamoDBDependency implements DependencyConstruct {
  readonly resourceId: string
  constructor(readonly table: dynamodb.Table) {
    this.resourceId = table.tableArn
  }
  public bind(grantable: iam.IGrantable): void {
    this.table.grantReadData(grantable)
    // this.table.grantWriteData()
    // this.table.grantReadWriteData()
  }
}
