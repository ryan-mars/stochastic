import { SQSHandler } from "aws-lambda"
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { DomainEvent, DomainEventEnvelope } from "stochastic"

const client = new EventBridgeClient({})
const EventBusName = process.env["EVENT_BUS_ARN"]
const Source = process.env["BOUNDED_CONTEXT_NAME"]
const log_level = (process.env["LOG_LEVEL"] ?? "info").toLowerCase()

export const handler: SQSHandler = async event => {
  if (log_level === "debug") {
    console.log(JSON.stringify({ event }, null, 2))
    console.log(JSON.stringify({ EVENT_BUS_ARN: `${process.env["EVENT_BUS_ARN"] ?? ""}` }, null, 2))
    console.log(JSON.stringify({ BOUNDED_CONTEXT_NAME: `${process.env["BOUNDED_CONTEXT_NAME"] ?? ""}` }, null, 2))
  }

  const entries = event.Records.map(({ body }) => ({
    body,
    event: JSON.parse(body) as DomainEventEnvelope<DomainEvent<string, any, string>>,
  }))
  await client.send(
    new PutEventsCommand({
      Entries: entries.map(entry => ({
        Detail: entry.body,
        DetailType: `${entry.event.type}`,
        EventBusName,
        Source,
      })),
    }),
  )
}
