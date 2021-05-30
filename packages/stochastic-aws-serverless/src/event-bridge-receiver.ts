import { SQSHandler } from "aws-lambda"
import * as env from "env-var"
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"

import { DomainEvent, DomainEventEnvelope } from "stochastic"

const sns = new SNSClient({})

interface EventBridgeEvent {
  id: string
  version: string
  account: string
  time: string
  region: string
  resources: string[]
  source: string
  "detail-type": string
  detail: DomainEventEnvelope<DomainEvent<string, any, string>>
}

const log_level = (process.env["LOG_LEVEL"] ?? "info").toLowerCase()

export const handler: SQSHandler = async sqsEvent => {
  if (log_level === "debug") {
    console.log(JSON.stringify({ sqsEvent }, null, 2))
    console.log(JSON.stringify({ EVENT_STREAM_TOPIC_ARN: `${process.env["EVENT_STREAM_TOPIC_ARN"] ?? ""}` }, null, 2))
  }

  const EVENT_STREAM_TOPIC_ARN: string = env.get("EVENT_STREAM_TOPIC_ARN").required().asString()

  const events = sqsEvent.Records.map(({ body }) => JSON.parse(body) as EventBridgeEvent)

  const publishCommands = events.map(event => {
    if (event["detail-type"] !== event.detail.type) {
      console.error(
        `EventBridge detail-type '${event["detail-type"]}' does not match stochastic event type ${event.detail.type}`,
      )
    }
    const eventType = event.detail.type ?? event["detail-type"] ?? "Unspecified"
    return new PublishCommand({
      Message: JSON.stringify({
        ...event.detail,
        "event-bridge-envelope": Object.fromEntries(Object.entries(event).filter(e => e[0] != "detail")),
      }),
      TopicArn: EVENT_STREAM_TOPIC_ARN,
      MessageAttributes: {
        event_type: {
          DataType: "String",
          StringValue: eventType,
        },
        // version: { // TODO
        //   // Event type version
        //   DataType: "String",
        //   StringValue: item.event.version ?? "0",
        // },
      },
    })
  })
  if (log_level === "debug") {
    console.log(JSON.stringify({ publishCommands }, null, 2))
  }

  const snsResult = await Promise.all(publishCommands.map(cmd => sns.send(cmd)))

  if (log_level === "debug") {
    console.log(JSON.stringify({ snsResult }, null, 2))
  }
}
