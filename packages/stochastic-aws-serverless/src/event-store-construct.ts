import * as dynamodb from "@aws-cdk/aws-dynamodb"
import * as lambda from "@aws-cdk/aws-lambda"
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources"
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs"
import * as sns from "@aws-cdk/aws-sns"
import * as sqs from "@aws-cdk/aws-sqs"
import * as cdk from "@aws-cdk/core"
import * as path from "path"
import { BoundedContext } from "stochastic"

export interface EventStoreProps {
  boundedContext: BoundedContext
  // tableProps?: dynamodb.TableProps;
}

// TODO: Create escape hatch for alternate event storage strategies
export class EventStore extends cdk.Construct {
  readonly table: dynamodb.Table
  readonly topic: sns.Topic

  constructor(scope: cdk.Construct, props: EventStoreProps) {
    super(scope, "EventStore")

    this.table = new dynamodb.Table(this, "Table", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE
      // ...props.tableProps // TODO: Necessary?
    })

    const topic = (this.topic = new sns.Topic(this, "Topic")) // TODO: FIFO?
    const dlq = new sqs.Queue(this, "DLQ")
    const forwarder = new nodeLambda.NodejsFunction(this, "Forwarder", {
      entry: path.join(__dirname, "forwarder.js"),
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        EVENT_STREAM_TOPIC_ARN: topic.topicArn // TODO: Move to SSM
      }
    })
    topic.grantPublish(forwarder)
    forwarder.addEventSource(
      new lambdaEventSources.DynamoEventSource(this.table, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        bisectBatchOnError: true,
        onFailure: new lambdaEventSources.SqsDlq(dlq),
        retryAttempts: 10
      })
    )
  }
}
