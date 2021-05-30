import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { DynamoDBStreamHandler } from "aws-lambda"
import * as env from "env-var"

const sns = new SNSClient({})

const log_level = (process.env["LOG_LEVEL"] ?? "info").toLowerCase()

export const handler: DynamoDBStreamHandler = async event => {
  const EVENT_STREAM_TOPIC_ARN: string = env.get("EVENT_STREAM_TOPIC_ARN").required().asString()
  if (log_level === "debug") {
    console.log(JSON.stringify({ event }, null, 2))
  }
  for (const record of event.Records) {
    try {
      if (record.eventName !== "INSERT") {
        if (log_level === "debug") {
          console.log(JSON.stringify({ message: `Skipping ${record.eventName}` }, null, 2))
        }

        continue
      }

      if (!record.dynamodb?.NewImage) {
        throw new Error(`Missing NewImage item in: ${JSON.stringify(record, null, 2)}`)
      }
      const item = unmarshall(record.dynamodb.NewImage as any)
      const { SequenceNumber } = record.dynamodb
      const data = await sns.send(
        new PublishCommand({
          Message: JSON.stringify({ ...item, SequenceNumber }),
          TopicArn: EVENT_STREAM_TOPIC_ARN,
          MessageAttributes: {
            event_type: {
              DataType: "String",
              StringValue: item.type ?? "Unspecified",
            },
            version: {
              // Event type version
              DataType: "String",
              StringValue: item.version ?? "0",
            },
          },
        }),
      )
      if (log_level === "debug") {
        console.log(
          JSON.stringify(
            {
              DynamoDBSequenceNumber: SequenceNumber,
              SNSMessageId: data.MessageId,
            },
            null,
            2,
          ),
        )
      }
    } catch (err) {
      console.error(err, err.stack)
      throw new Error(err)
    }
  }
}
