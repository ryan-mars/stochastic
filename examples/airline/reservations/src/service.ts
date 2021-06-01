import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { FlightCancelled } from "operations"
import { Temporal } from "proposal-temporal"
import { ScheduledFlightsAdded, ScheduledFlightsRemoved, AirportTZ, AirportCode } from "scheduling"
import { BoundedContext, Command, Config, DomainEvent, Policy, ReadModel, Shape, Store, TableConfig } from "stochastic"
import { array, create, number, object, string } from "superstruct"

const reservationShape = {
  reservationNo: string(),
  flights: array(
    object({
      day: string(),
      flightNo: string(),
      origin: string(),
      destination: string(),
      departureTime: string(),
      arrivalTime: string(),
    }),
  ),
  traveler: object({
    firstName: string(),
    lastName: string(),
    dob: string(),
    loyaltyId: string(),
    loyaltyStatus: string(),
  }),
}

export class ReservationBooked extends DomainEvent("ReservationBooked", "reservationNo", reservationShape) {}
export class ReservationFlightChanged extends DomainEvent("ReservationFlightChanged", "reservationNo", {
  reservationNo: string(),
  flights: array(
    object({
      day: string(),
      flightNo: string(),
      origin: string(),
      destination: string(),
      departureTime: string(),
      arrivalTime: string(),
    }),
  ),
}) {}

export class CustomerReservation extends Shape("CustomerReservation", reservationShape) {}

export const customerReservationStore = new Store({
  __filename,
  stateShape: CustomerReservation,
  stateKey: "reservationNo",
  events: [ReservationBooked, ReservationFlightChanged],
  reducer: (state, event) => {
    return state
  },
  initialState: () =>
    new CustomerReservation({
      reservationNo: "",
      flights: [
        {
          day: "",
          flightNo: "",
          origin: "",
          destination: "",
          departureTime: "",
          arrivalTime: "",
        },
      ],
      traveler: {
        firstName: "",
        lastName: "",
        dob: "",
        loyaltyId: "",
        loyaltyStatus: "",
      },
    }),
})

export class BookReservationIntent extends Shape("BookReservationIntent", reservationShape) {}
export class BookReservationConfirmation extends Shape("BookReservationIntent", {
  receiptNo: string(),
}) {}
export const bookReservation = new Command(
  {
    __filename,
    events: [ReservationBooked],
    intent: BookReservationIntent,
    confirmation: BookReservationConfirmation,
    store: customerReservationStore,
  },
  context => async (command, store) => {
    return {
      confirmation: new BookReservationConfirmation({
        receiptNo: "booking-123",
      }),
      events: [new ReservationBooked(command)],
    }
  },
)

export class ModifyReservationFlightsIntent extends Shape("ModifyReservationFlightsIntent", {
  reservationNo: string(),
  flights: array(
    object({
      day: string(),
      flightNo: string(),
      origin: string(),
      destination: string(),
      departureTime: string(),
      arrivalTime: string(),
    }),
  ),
}) {}

export const modifyReservationFlights = new Command(
  {
    __filename,
    intent: ModifyReservationFlightsIntent,
    confirmation: undefined,
    events: [ReservationFlightChanged],
    store: customerReservationStore,
  },
  context => {
    return async (command, store) => {
      return [
        new ReservationFlightChanged({
          reservationNo: "",
          flights: [
            {
              day: "",
              flightNo: "",
              origin: "",
              destination: "",
              departureTime: "",
              arrivalTime: "",
            },
          ],
        }),
      ]
    }
  },
)

const singleTableConfig = new Config("SingleTable", TableConfig)

class FlightOption extends Shape("FlightOption", {
  flightNo: string(),
  route: string(),
  day: string(),
  departureTime: string(),
  arrivalTime: string(),
  seatsBooked: number(),
  seats: number(),
}) {}

// TODO: NEXT FINISH THIS SIMPLE IMPLEMENTATION THEN REFACTOR TO ONE-TABLE
export const rebookingOptionsReadModel = new ReadModel({
  __filename,
  events: [
    ScheduledFlightsAdded, // TODO: Handle reservation cancelled/udpated, flights updated, etc...
    ScheduledFlightsRemoved,
    // ScheduledFlightsUpdated,
    ReservationBooked,
    ReservationFlightChanged,
  ],
  config: [singleTableConfig],
  /**
   * Projection function that stores events to prepare the read model.
   *
   * pk: ROUTE#<route>#DATE#<YYYY-MM-DD>
   * sk: FLIGHT
   * gsi1pk: ROUTE#<route>
   * gsi1sk: DEPARTURE#<departure time>
   */
  projection: config => {
    console.log(JSON.stringify({ config }, null, 2))

    return async event => {
      const dynamodb = new DynamoDBClient({})
      console.log(JSON.stringify({ message: "###############################" }, null, 2))
      console.log(JSON.stringify({ event }, null, 2))
      // TODO: Handle out of order events
      switch (event.payload.__typename) {
        case "ScheduledFlightsAdded":
          const { route } = event.payload

          await Promise.all(
            event.payload.flights
              .map<PutItemCommandInput>(flight => ({
                TableName: config.SingleTable.tableName,
                Item: marshall({
                  pk: `FLIGHT#${flight.flightNo}#DATE#${flight.day}`,
                  sk: `FLIGHT`,
                  gsi1pk: `ROUTE#${route}`,
                  gsi1sk: `DEPARTURE#${flight.departureTime}`,
                  ...new FlightOption({ route, ...flight, seatsBooked: 0 }),
                }),
              }))
              .map(p => new PutItemCommand(p))
              .map(c => dynamodb.send(c)),
          )

          break
        case "ScheduledFlightsRemoved":
          await Promise.all(
            event.payload.flights
              .map<UpdateItemCommandInput>(flight => ({
                TableName: config.SingleTable.tableName,
                Key: marshall({ pk: `FLIGHT#${flight.flightNo}#DATE#${flight.day}`, sk: `FLIGHT` }),
                UpdateExpression: "SET removed = :bool",
                ExpressionAttributeValues: marshall({ ":removed": true }),
              }))
              .map(u => new UpdateItemCommand(u))
              .map(c => dynamodb.send(c)),
          )
          break
        // case "ScheduledFlightsUpdated":
        //   throw new Error(`${event.payload.__typename} Not implemented yet`)
        //   break
        case "ReservationBooked":
          await Promise.all(
            event.payload.flights
              .map<UpdateItemCommandInput>(flight => ({
                TableName: config.SingleTable.tableName,
                Key: marshall({ pk: `FLIGHT#${flight.flightNo}#DATE#${flight.day}`, sk: `FLIGHT` }),
                UpdateExpression: "SET seatsBooked = seatsBooked + :seatsBooked",
                ExpressionAttributeValues: marshall({ ":seatsBooked": 1 }),
              }))
              .map(u => new UpdateItemCommand(u))
              .map(c => dynamodb.send(c)),
          )
          break
        default:
          break
      }
    }
  },
  client: config => {
    const dynamodb = new DynamoDBClient({})
    return async (props: {
      route: string
      departingFromLocalTime: Temporal.ZonedDateTime
      departingTillLocalTime: Temporal.ZonedDateTime
    }) => {
      const queryCommandInput: QueryCommandInput = {
        TableName: config.SingleTable.tableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk AND gsi1sk BETWEEN :till AND :from",
        ExpressionAttributeValues: {
          // TODO: Fix time format
          ":pk": { S: `ROUTE#${props.route}` },
          ":till": { S: `DEPARTURE#${props.departingTillLocalTime.toInstant().toString()}` },
          ":from": { S: `DEPARTURE#${props.departingFromLocalTime.toInstant().toString()}` },
        },
      }
      console.log(JSON.stringify({ queryCommandInput }, null, 2))
      const output = await dynamodb.send(new QueryCommand(queryCommandInput))
      console.log(JSON.stringify({ output }, null, 2))
      if (output.Items) {
        return create(
          output.Items.map(i => unmarshall(i)),
          array(object(FlightOption.fields)),
        )
      }
      return null
    }
  },
})

class Passenger extends Shape("Passenger", {
  reservationNo: string(),
  flightNo: string(),
  day: string(),
  route: string(),
  departureTime: string(),
  arrivalTime: string(),
  firstName: string(),
  lastName: string(),
  dob: string(),
  loyaltyId: string(),
  loyaltyStatus: string(),
}) {}

export const passengersByFlightReadModel = new ReadModel({
  __filename,
  events: [ReservationBooked], // TODO: Handle reservation updated/cancelled
  config: [singleTableConfig],
  /**
   * Projection function that stores events to prepare the read model.
   *
   * pk: FLIGHT#<flightNo>#DATE#<YYYY-MM-DD>
   * sk: RESERVATION#<reservationNo>
   */
  projection: ({ SingleTable }) => {
    const ddb = new DynamoDBClient({})

    return async event => {
      const resFlights: PutItemCommandInput[] = event.payload.flights.map(flight => ({
        TableName: SingleTable.tableName,
        Item: {
          pk: {
            S: `FLIGHT#${flight.flightNo}#DATE#${flight.day}`,
          },
          sk: {
            S: `RESERVATION#${event.payload.reservationNo}`,
          },
          ...marshall(
            new Passenger({
              ...event.payload.traveler,
              ...flight,
              reservationNo: event.payload.reservationNo,
              route: `${flight.origin}-${flight.destination}`,
            }),
            { convertClassInstanceToMap: true },
          ),
        },
      }))
      await Promise.all(resFlights.map(i => new PutItemCommand(i)).map(c => ddb.send(c)))
    }
  },
  /**
   * Returns an object that encapsulates the data access logic.
   */
  client: ({ SingleTable }) => {
    const ddb = new DynamoDBClient({})

    return async (flightNo: string, day: string) => {
      const output = await ddb.send(
        new QueryCommand({
          TableName: SingleTable.tableName,
          KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
          ExpressionAttributeValues: marshall({ ":pk": `FLIGHT#${flightNo}#DATE#${day}`, ":sk": "RESERVATION#" }),
        }),
      )

      // TODO: fetch multiple pages

      if (output.Items) {
        const data = output.Items.map(i => unmarshall(i))
        return create(data, array(object(Passenger.fields)))
      }
      return null
    }
  },
})

export const rebookingPolicy = new Policy(
  {
    __filename,
    events: [FlightCancelled],
    commands: {
      modifyReservationFlights,
    },
    reads: {
      passengersByFlightReadModel,
      rebookingOptionsReadModel,
    },
  },
  context => {
    // happens once when the container starts
    // ...

    return async (
      event,
      { modifyReservationFlights },
      { passengersByFlightReadModel, rebookingOptionsReadModel },
      context,
    ) => {
      const { flightNo, day } = event
      // get the passengers for this flight (reservations read model)
      const passengers = await passengersByFlightReadModel(event.flightNo, event.day)
      if (!passengers) {
        throw new Error(`No passengers found for flightNo: ${flightNo} day: ${day}`)
      }

      console.log(JSON.stringify({ passengers }, null, 2))
      const origin = event.origin as keyof typeof AirportCode

      // get rebooking options for the next 48 hours departing no less than 30 minutes from now
      const options = await rebookingOptionsReadModel({
        route: event.route,
        departingFromLocalTime: Temporal.now.zonedDateTimeISO(AirportTZ[origin]).add({ minutes: 30 }),
        departingTillLocalTime: Temporal.now.zonedDateTimeISO(AirportTZ[origin]).add({ hours: 48 }),
      })

      console.log(JSON.stringify({ options }, null, 2))

      // TODO: Change reservation to the next available flight
      // TODO: Handle failures gracefully
      await modifyReservationFlights(
        new ModifyReservationFlightsIntent({
          flights: [],
          reservationNo: "",
        }),
      )
    }
  },
)

export const reservations = new BoundedContext({
  handler: "reservations",
  name: "Reservations",
  components: {
    customerReservationStore,
    bookReservation,
    modifyReservationFlights,
    rebookingPolicy,
    passengersByFlightReadModel,
    rebookingOptionsReadModel,
  },
  emits: [ReservationFlightChanged],
})

// OUTSIDE WORLD

// export class GetSeatAvailabilityRequest extends Shape("GetSeatAvailabilityRequest", {
//   reservationNo: string()
// }) {}

// export class GetSeatAvailabilityResponse extends Shape("GetSeatAvailabilityResponse", {
//   reservationNo: string(),
//   availableSeats: number()
// }) {}

// export const AvailabilityQuery = new Query(
//   {
//     __filename,
//     /**
//      * We take a dependency on one or mode read models
//      */
//     reads: [AvailableSeats],
//     question: GetSeatAvailabilityRequest,
//     answer: GetSeatAvailabilityResponse
//   },
//   availableSeats => async request => {
//     /**
//      * Then, implement a function to implement the Query's request/response contract
//      */
// return new GetSeatAvailabilityResponse({
//   reservationNo: request.reservationNo,
//   availableSeats: (await availableSeats(request.reservationNo)) ?? 0
// })
//   }
// )
