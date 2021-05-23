import {
  Aggregate,
  BoundedContext,
  Command,
  Dependency,
  DomainEvent,
  Policy,
  Query,
  ReadModel,
  Shape
} from "stochastic"
import { array, number, object, string } from "superstruct"
import { FlightCancelled } from "operations"

import dynamodb from "@aws-sdk/client-dynamodb"
import dynamodbUtil from "@aws-sdk/util-dynamodb"

const reservationShape = {
  reservationNo: string(),
  flights: array(
    object({
      day: string(),
      flightNo: string(),
      origin: string(),
      destination: string(),
      departureTime: string(),
      arrivalTime: string()
    })
  ),
  traveler: object({
    firstName: string(),
    lastName: string(),
    dob: string(),
    loyaltyId: string(),
    loyaltyStatus: string()
  })
}

export class ReservationBooked extends DomainEvent("ReservationBooked", "reservationNo", reservationShape) {}
export class FlightReservationsChanged extends DomainEvent("FlightReservationsChanged", "reservationNo", {
  reservationNo: string(),
  flights: array(
    object({
      day: string(),
      flightNo: string(),
      origin: string(),
      destination: string(),
      departureTime: string(),
      arrivalTime: string()
    })
  )
}) {}

export class CustomerReservation extends Shape("CustomerReservation", reservationShape) {}

export const CustomerReservationAggregate = new Aggregate({
  __filename,
  stateShape: CustomerReservation,
  stateKey: "reservationNo",
  events: [ReservationBooked, FlightReservationsChanged],
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
          arrivalTime: ""
        }
      ],
      traveler: {
        firstName: "",
        lastName: "",
        dob: "",
        loyaltyId: "",
        loyaltyStatus: ""
      }
    })
})

export class BookReservationIntent extends Shape("BookReservationIntent", reservationShape) {}
export const BookReservation = new Command(
  {
    __filename,
    events: [ReservationBooked],
    intent: BookReservationIntent,
    aggregate: CustomerReservationAggregate
  },
  async (command, aggregate) => {
    return [new ReservationBooked(command)]
  }
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
      arrivalTime: string()
    })
  )
}) {}

export const ModifyReservationFlights = new Command(
  {
    __filename,
    intent: ModifyReservationFlightsIntent,
    events: [FlightReservationsChanged],
    aggregate: CustomerReservationAggregate
  },
  async (command, aggregate) => {
    return [
      new FlightReservationsChanged({
        reservationNo: "",
        flights: [
          {
            day: "",
            flightNo: "",
            origin: "",
            destination: "",
            departureTime: "",
            arrivalTime: ""
          }
        ]
      })
    ]
  }
)

const dynamoTable = new Dependency("SeatsTable")

export const AvailableSeats = new ReadModel(
  {
    __filename,
    events: [ReservationBooked],
    dependencies: [dynamoTable]
  },
  /**
   * Projection function that aggregates events to prepare the read model.
   */
  ({ SeatsTable }) => {
    const ddb = new dynamodb.DynamoDBClient({})

    return async event => {
      await ddb.send(
        new dynamodb.UpdateItemCommand({
          TableName: SeatsTable,
          Key: {
            reservationNo: {
              S: event.reservationNo
            }
          },
          UpdateExpression: "ADD availableSeats :q",
          ExpressionAttributeValues: {
            ":q": {
              N: "1"
            }
          }
        })
      )
    }
  },
  /**
   * Initializer for the interface to this read model.
   */
  ({ SeatsTable }) => {
    const ddb = new dynamodb.DynamoDBClient({})

    return async (reservationNo: string) => {
      const item = await ddb.send(
        new dynamodb.GetItemCommand({
          TableName: SeatsTable,
          Key: {
            reservationNo: {
              S: reservationNo
            }
          }
        })
      )

      if (item.Item?.availableSeats.N !== undefined) {
        return parseInt(item.Item.availableSeats.N, 10)
      } else {
        return null
      }
    }
  }
)

export class GetSeatAvailabilityRequest extends Shape("GetSeatAvailabilityRequest", {
  reservationNo: string()
}) {}

export class GetSeatAvailabilityResponse extends Shape("GetSeatAvailabilityResponse", {
  reservationNo: string(),
  availableSeats: number()
}) {}

export const AvailabilityQuery = new Query(
  {
    __filename,
    /**
     * We take a dependency on one or mode read models
     */
    models: [AvailableSeats],
    request: GetSeatAvailabilityRequest,
    results: GetSeatAvailabilityResponse
  },
  async (request, availableSeats) => {
    /**
     * Then, implement a function to implement the Query's request/response contract
     */
    return new GetSeatAvailabilityResponse({
      reservationNo: request.reservationNo,
      availableSeats: (await availableSeats(request.reservationNo)) ?? 0
    })
  }
)

export const RebookingPolicy = new Policy(
  {
    __filename,
    events: [FlightCancelled],
    commands: [ModifyReservationFlights]
  },
  async (event, commands) => {
    console.log(JSON.stringify(event, null, 2))
    console.log({ commands })

    // TODO: get the passengers for this flight (booking read model)
    // TODO: sort passengers by status
    // TODO: find flights leaving in no less than one hour from the same origin to the same destination (scheduling read model)
    // TODO: Check seat availability (booking read model)
    // TODO: Change reservation to the next available flight
    // TODO: Handle failures gracefully

    /**
     * CAVEATS:
     * Usually operations takes over ownership of the manifest for a flight 1 hour before departure and booking cannot modify it. In this case we're going to pretend Reservations always owns the manifest.
     * Customer service will want to be able to "lock" a reservation so no other procesess modify it while they're on the phone with a customer
     *
     */
  }
)

export const reservations = new BoundedContext({
  handler: "reservations",
  name: "Reservations",
  components: {
    CustomerReservationAggregate,
    BookReservation,
    ModifyReservationFlights,
    RebookingPolicy,
    AvailableSeats,
    AvailabilityQuery
  },
  emits: [FlightReservationsChanged]
})
