import { SQSHandler } from "aws-lambda";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { DomainEvent, DomainEventEnvelope } from "stochastic";

const client = new EventBridgeClient({});
const EventBusName = process.env["EVENT_BUS_ARN"];
const Source = process.env["BOUNDED_CONTEXT_NAME"];

export const handler: SQSHandler = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  console.log("YOU SHOULD PUT THIS ON THE EVENT BUS");
  console.log(`EVENT_BUS_ARN ${process.env["EVENT_BUS_ARN"]}`);
  console.log(`BOUNDED_CONTEXT_NAME ${process.env["BOUNDED_CONTEXT_NAME"]}`);

  const entries = event.Records.map(({ body }) => ({ body, event: JSON.parse(body) as DomainEventEnvelope<DomainEvent<string, any, string>> }));
  await client.send(
    new PutEventsCommand({
      Entries: entries.map((entry) => ({
        Detail: entry.body,
        DetailType: `${entry.event.type}`,
        EventBusName,
        Source,
      })),
    }),
  );
};
