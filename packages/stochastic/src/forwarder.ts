import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamHandler } from "aws-lambda";
import * as env from "env-var";

const sns = new SNSClient({});

export const handler: DynamoDBStreamHandler = async (event) => {
  const EVENT_STREAM_TOPIC_ARN: string = env.get("EVENT_STREAM_TOPIC_ARN").required().asString();
  for (const record of event.Records) {
    try {
      // TODO: add shape name (event type)
      // https://github.com/punchcard/punchcard/blob/dbbd1282a7733e6886571f5f6e537168af95ff40/packages/%40punchcard/shape-json/src/json.ts#L77-L88

      if (record.eventName !== "INSERT") {
        console.log(`Skipping ${record.eventName}`);
        continue;
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
              // Event type
              DataType: "String",
              StringValue: item.name ?? "Unspecified", // FIXME: strongly type events
            },
            version: {
              // Event type version
              DataType: "String",
              StringValue: item.version,
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
