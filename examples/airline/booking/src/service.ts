import { Aggregate, BoundedContext, Command, DomainEvent, Shape } from "stochastic"
import { scheduling } from "scheduling/lib/index"
import { array, object, string } from "superstruct"

const bookingShape = {
  bookingNo: string(),
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

export class ReservationCreated extends DomainEvent("ReservationCreated", "bookingNo", bookingShape) {}
export class FlightChanged extends DomainEvent("FlightChanged", "bookingNo", {
  bookingNo: string(),
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

export class CustomerBooking extends Shape("CustomerBooking", bookingShape) {}

export const CustomerBookingAggregate = new Aggregate({
  __filename,
  stateShape: CustomerBooking,
  stateKey: "bookingNo",
  events: [ReservationCreated, FlightChanged],
  reducer: (state, event) => {
    return state
  },
  initialState: () =>
    new CustomerBooking({
      bookingNo: "",
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

export class CreateReservationIntent extends Shape("CreateReservationIntent", bookingShape) {}

export const CreateReservation = new Command(
  { __filename, events: [ReservationCreated], intent: CreateReservationIntent, aggregate: CustomerBookingAggregate },
  async (command, aggregate) => {
    return [new ReservationCreated(command)]
  }
)

export const booking = new BoundedContext({
  handler: "booking",
  name: "Booking",
  components: {
    CustomerBookingAggregate,
    CreateReservation
  }
})
