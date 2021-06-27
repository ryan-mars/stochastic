import { Store, BoundedContext, Command, DomainEvent, Shape } from "stochastic"
import { string } from "superstruct"

const flightScheduleDetail = {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
  tailNo: string(),
  departureTime: string(),
  arrivalTime: string(),
}

export class AddFlightIntent extends Shape("AddFlight", flightScheduleDetail) {}

export class FlightAddedEvent extends DomainEvent("FlightAdded", "flightNo", flightScheduleDetail) {}
export class FlightCancelled extends DomainEvent("FlightCancelled", "flightNo", {
  flightNo: string(),
  day: string(),
  route: string(),
  origin: string(),
  destination: string(),
  cancelledAt: string(),
}) {}

export class OperatedFlight extends Shape("OperatedFlight", {
  flightNo: string(),
}) {}

const FlightStore = new Store({
  __filename,
  stateKey: "flightNo",
  stateShape: OperatedFlight,
  events: [FlightAddedEvent, FlightCancelled],
  initialState: () => new OperatedFlight({ flightNo: "" }),
  reducer: (state, event) => {
    switch (event.__typename) {
      case "FlightAdded":
        return new OperatedFlight({ flightNo: event.flightNo })
      default:
        return state
    }
  },
})

export const AddFlight = new Command(
  {
    __filename,
    store: FlightStore,
    intent: AddFlightIntent,
    confirmation: undefined,
    events: [FlightAddedEvent],
  },
  context => async (command, store) => {
    const { state, events } = await store.get(command.flightNo)

    if (events.length > 0) {
      throw new Error("cannot create a flight that already exists")
    }

    return [
      new FlightAddedEvent({
        ...command,
      }),
    ]
  },
)

export class CancelFlightIntent extends Shape("CancelFlightIntent", {
  flightNo: string(),
  day: string(),
  route: string(),
  origin: string(),
  destination: string(),
  cancelledAt: string(),
}) {}

export const CancelFlight = new Command(
  {
    __filename,
    store: FlightStore,
    intent: CancelFlightIntent,
    confirmation: undefined,
    events: [FlightCancelled],
  },
  context => async (command, store) => {
    return [new FlightCancelled({ ...command })]
  },
)

export class ArriveFlightIntent extends Shape("ArriveFlightIntent", {
  flightNo: string(),
  day: string(),
  arrivedAt: string(),
  airport: string(),
}) {}

export class FlightArrived extends DomainEvent("FlightArrived", "flightNo", ArriveFlightIntent.fields) {}

export const ArriveFlight = new Command(
  {
    __filename,
    store: FlightStore,
    intent: ArriveFlightIntent,
    confirmation: undefined,
    events: [FlightArrived],
  },
  context => async (command, store) => {
    return [
      new FlightArrived({
        ...command,
      }),
    ]
  },
)

export const operations = new BoundedContext({
  handler: "operations",
  name: "Operations",
  components: {
    AddFlight,
    CancelFlight,
    ArriveFlight,
    FlightStore,
  },
  emits: [FlightCancelled, FlightArrived],
})
