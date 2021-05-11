import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient, PutItemCommand, QueryCommand, QueryCommandInput, AttributeValue } from "@aws-sdk/client-dynamodb";

import { Shape, DomainEvent, DomainEventEnvelope } from "stochastic";

const client = new DynamoDBClient({});

export interface ConnectAggregateInterfaceProps<T extends Shape = Shape, Events extends readonly DomainEvent[] = readonly DomainEvent[]> {
  eventStore: string;
  source: string;
  initialState: () => Shape.Value<T>;
  reducer: (state: Shape.Value<T>, event: Shape.Value<Events[number]>) => Shape.Value<T>;
}

// TODO: tighten up types
export function connectAggregateInterface<T extends Shape = Shape, Events extends readonly DomainEvent[] = readonly DomainEvent[]>(
  props: ConnectAggregateInterfaceProps<T, Events>,
) {
  return {
    get: async (key: string) => {
      let state = props.initialState();
      let events = [];
      for await (const event of fetchEvents(props.eventStore, props.source, key)) {
        events.push(event as DomainEventEnvelope<Shape.Value<Events[number]>>);
        state = props.reducer(state, event.payload as Shape.Value<Events[number]>);
      }
      return {
        state,
        events,
      };
    },
  };
}

interface SerializableDomainEvent {
  id: string;
  time: string;
  source: string;
  source_id: string;
  bounded_context: string;
  event_type: string;
  payload: any;
}

export const storeEvent = async (dynamoDBTableName: string, event: SerializableDomainEvent) => {
  // TODO: Validate input event
  /**
   * validate:
   * id is KSUID
   * time is ISO 8601
   * type is nonzero string
   * aggregate is nonzero string
   * aggregate_id is nonzero string
   */
  const pk = `${event.source}#${event.source_id}`;
  const sk = `EVENT#${event.id}`;

  try {
    const data = await client.send(
      new PutItemCommand({
        TableName: dynamoDBTableName,
        Item: marshall({
          pk,
          sk,
          ...event,
        }),
      }),
    );
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    throw error;
  }
};

export async function* fetchEvents(dynamoDBTableName: string, source: string, source_id: string) {
  const pk = `${source}#${source_id}`;
  const params = {
    TableName: dynamoDBTableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeValues: marshall({ ":pk": pk }),
    ExpressionAttributeNames: { "#pk": "pk" },
  };

  try {
    let output = await dynamodDBQueryWithContinuation(params);
    if (output.Items) {
      for (let item of output.Items) {
        yield unmarshall(item);
      }
    }

    while (output.LastEvaluatedKey) {
      console.log(`Continuing query`, JSON.stringify(output.LastEvaluatedKey, null, 2));
      output = await dynamodDBQueryWithContinuation(params, output.LastEvaluatedKey);

      if (output.Items) {
        for (let item of output.Items) {
          yield unmarshall(item);
        }
      }
    }
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    throw error;
  }
}

async function dynamodDBQueryWithContinuation(params: QueryCommandInput, ExclusiveStartKey?: { [key: string]: AttributeValue }) {
  return client.send(
    new QueryCommand({
      ...params,
      ExclusiveStartKey,
    }),
  );
}

// (async () => {
//   for await (const event of fetchEvents("EventLog", "Flight", "PA123")) {
//     //console.log(event);
//   }
// })();

// (async () => {
//   const ksuid = require("ksuid");

//   const events = [
//     { type: "FlightDeparted", where: "SFO" },
//     { type: "FlightArrived", where: "MIA" },
//   ];

//   let millis = Date.now();

//   for (let index = 0; index < 10000; index++) {
//     events.forEach((element) => {
//       const time = new Date(millis);
//       storeEvent("EventLog", {
//         id: ksuid.randomSync(time).string, // KSUID
//         time: time.toISOString(),
//         source: "Flight",
//         source_id: "PA123",
//         bounded_context: "Operations",
//         event_type: element.type,
//         payload: {
//           where: element.where,
//           at: time.toISOString(),
//         },
//       });
//     });
//     millis += 3.6e6 * 6;
//   }
// })();