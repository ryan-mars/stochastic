import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamHandler } from "aws-lambda";
import * as env from "env-var";

const sns = new SNSClient({});

export const handler: DynamoDBStreamHandler = async (event) => {
  const EVENT_STREAM_TOPIC_ARN: string = env.get("EVENT_STREAM_TOPIC_ARN").required().asString();
  console.log(JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    try {
      if (record.eventName !== "INSERT") {
        console.log(`Skipping ${record.eventName}`);
        continue
      }

      if (!record.dynamodb?.NewImage) {
        throw new Error(`Missing NewImage item in: ${JSON.stringify(record, null, 2)}`);
      }
      const item = unmarshall(record.dynamodb.NewImage as any);
      const { SequenceNumber } = record.dynamodb;
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
      );
      console.log({
        DynamoDBSequenceNumber: SequenceNumber,
        SNSMessageId: data.MessageId,
      });
    } catch (err) {
      console.error(err, err.stack);
      throw new Error(err);
    }
  }
};
