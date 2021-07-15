import * as cdk from "@aws-cdk/core"
import * as kinesis from "@aws-cdk/aws-kinesis"
import * as kinesisanalytics from "@aws-cdk/aws-kinesisanalytics"
import * as kms from "@aws-cdk/aws-kms"
import * as s3 from "@aws-cdk/aws-s3"
import * as glue from "@aws-cdk/aws-glue"
import * as timestream from "@aws-cdk/aws-timestream"

import { BoundedContext, Command } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { CommandConstruct } from "./command-construct"
import { PolicyConstruct } from "./policy-construct"

export interface DataLakeProps<Context extends BoundedContext = BoundedContext> extends cdk.StackProps {
  /**
   * A reference to the provisioned Bounded Context.
   */
  context: BoundedContextConstruct<Context>
  /**
   * Name of the Kinesis Stream containing all events within a Bounded Context.
   *
   * @default - ${boundedContext.name}-event-stream
   */
  streamName?: string
  /**
   * Configure encryption for the Kinesis Stream.
   */
  streamEncryption?: kinesis.StreamEncryption
  /**
   * Name of the S3 bucket.
   *
   * @default - ${boundedContextName}-event-stream-${aws account}-${aws region}
   */
  bucketName?: string
  /**
   * Configure encryption for the data stored in the S3 Bucket.
   */
  bucketEncryption?: s3.BucketEncryption
}

/**
 * Provisions a Data Lake storing all Domain Events, Command payloads and Store deltas in a Bounded Context. This data
 * is collected into a single Kinesis Stream and processed by an Apache Flink application running on an Kinesis Analytics
 * managed Flink cluster. This application consumes from the stream, partitions the data by type and time and stores
 * the data in S3 as encrypted JSON and Parquet files. These partitions are then updated in the corresponding AWS Glue
 * Tables so that they can be queried in Athena, Spark and Hadoop (or any other Hive-compatible consumer). Data can also
 * be configured to be loaded into an AWS Timestream instance to enable fast time-stream analysis.
 */
export class DataLake<Context extends BoundedContext = BoundedContext> extends cdk.Stack {
  /**
   * A Kinesis Stream containing all Domain Events, issues Commands and Store deltas.
   */
  readonly eventStream: kinesis.Stream
  /**
   * KMS encryption key for the Data Lake if KMS encryption is enabled for the Kinesis Stream.
   */
  readonly eventStreamEncryptionKey: kms.Key | undefined
  /**
   * S3 bucket containing all of the data for each Table.
   */
  readonly eventBucket: s3.Bucket
  /**
   * KMS encryption key for the S3 bucket if KMS encryption is enabled for the S3 Bucket.
   */
  readonly eventDatabase: glue.Database
  /**
   * Timestream Database containing time-series data for a Bounded Context.
   */
  readonly eventTimestream: timestream.CfnDatabase

  constructor(scope: cdk.App, id: string, props: DataLakeProps<Context>) {
    super(scope, id)

    this.eventStreamEncryptionKey =
      props.streamEncryption === kinesis.StreamEncryption.KMS
        ? new kms.Key(this, "EventStreamEncryptionKey")
        : undefined

    this.eventStream = new kinesis.Stream(this, "EventStream", {
      streamName: props.streamName ?? `${props.context.boundedContext.name}-event-stream`,
      encryption: props.streamEncryption,
      encryptionKey: this.eventStreamEncryptionKey,
    })

    this.eventBucket = new s3.Bucket(this, "EventBucket", {
      bucketName: props.bucketName ?? `${props.context.boundedContext.name}-${this.account}-${this.region}`,
      encryption: props.bucketEncryption,
    })

    this.eventDatabase = new glue.Database(this, "EventDatabase", {
      databaseName: props.context.boundedContext.name,
    })

    this.eventTimestream = new timestream.CfnDatabase(this, "EventTimeStream", {
      databaseName: `${props.context.boundedContext.name}-event-stream`,
      kmsKeyId: this.eventStreamEncryptionKey?.keyId,
    })
  }
}
