import {
  Aggregate,
  BoundedContext,
  Command,
  Config,
  DomainEvent,
  Policy,
  ReadModel,
  Shape,
  TableConfig
} from "stochastic"
import { array, object, string } from "superstruct"
import { FlightCancelled } from "operations"

import dynamodb from "@aws-sdk/client-dynamodb"

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

export const customerReservationAggregate = new Aggregate({
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
export class BookReservationConfirmation extends Shape("BookReservationIntent", {
  receiptNo: string()
}) {}
export const bookReservation = new Command(
  {
    __filename,
    events: [ReservationBooked],
    intent: BookReservationIntent,
    confirmation: BookReservationConfirmation,
    state: customerReservationAggregate
  },
  context => async (command, aggregate) => {
    return {
      confirmation: new BookReservationConfirmation({
        receiptNo: "booking-123"
      }),
      events: [new ReservationBooked(command)]
    }
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

export const modifyReservationFlights = new Command(
  {
    __filename,
    intent: ModifyReservationFlightsIntent,
    confirmation: undefined,
    events: [FlightReservationsChanged],
    state: customerReservationAggregate
  },
  context => {
    return async (command, aggregate) => {
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
  }
)

const seatsTable = new Config("SeatsTable", TableConfig)

export const availableSeats = new ReadModel({
  __filename,
  events: [ReservationBooked],
  config: [seatsTable],
  /**
   * Projection function that aggregates events to prepare the read model.
   */
  projection: ({ SeatsTable }) => {
    const ddb = new dynamodb.DynamoDBClient({})

    return async (event, context) => {
      await ddb.send(
        new dynamodb.UpdateItemCommand({
          TableName: SeatsTable.tableName,
          Key: {
            reservationNo: {
              S: event.payload.reservationNo
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
   * Returns an object that encapsulates the data access logic.
   */
  client: ({ SeatsTable }) => {
    const ddb = new dynamodb.DynamoDBClient({})

    return async (reservationNo: string) => {
      const item = await ddb.send(
        new dynamodb.GetItemCommand({
          TableName: SeatsTable.tableName,
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
})

export const rebookingPolicy = new Policy(
  {
    __filename,
    events: [FlightCancelled],
    commands: {
      modifyReservationFlights
    },
    reads: {
      availableSeats
    }
  },
  context => {
    // happens once when the container starts

    return async (event, { modifyReservationFlights }, { availableSeats }, context) => {
      const seats = await availableSeats(event.flightNo)

      await modifyReservationFlights(
        new ModifyReservationFlightsIntent({
          flights: [],
          reservationNo: ""
        })
      )

      // return new GetSeatAvailabilityResponse({
      //   reservationNo: request.reservationNo,
      //   availableSeats: (await availableSeats(request.reservationNo)) ?? 0
      // })
      // console.log(JSON.stringify(event, null, 2))
      // console.log({ commands })
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
  }
)

export const reservations = new BoundedContext({
  handler: "reservations",
  name: "Reservations",
  components: {
    customerReservationAggregate,
    bookReservation,
    modifyReservationFlights,
    rebookingPolicy,
    availableSeats
    // AvailabilityQuery
  },
  emits: [FlightReservationsChanged]
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
