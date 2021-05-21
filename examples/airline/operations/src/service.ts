import { Aggregate, BoundedContext, Command, DomainEvent, Policy, Shape } from "stochastic"
import { ScheduledFlightsAdded } from "scheduling"
import { string } from "superstruct"

const flightScheduleDetail = {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
  tailNo: string(),
  departureTime: string(),
  arrivalTime: string()
}

export class AddFlightIntent extends Shape("AddFlight", flightScheduleDetail) {}

export class FlightAddedEvent extends DomainEvent("FlightAdded", "flightNo", flightScheduleDetail) {}
export class FlightCancelled extends DomainEvent("FlightCancelled", "flightNo", {
  flightNo: string(),
  day: string()
}) {}

export class OperatedFlight extends Shape("OperatedFlight", {
  flightNo: string()
}) {}

const FlightAggregate = new Aggregate({
  __filename,
  stateKey: "flightNo",
  stateShape: OperatedFlight,
  events: [FlightAddedEvent],
  initialState: () => new OperatedFlight({ flightNo: "" }),
  reducer: (state, event) => {
    switch (event.__typename) {
      case "FlightAdded":
        return new OperatedFlight({ flightNo: event.flightNo })
      default:
        return state
    }
  }
})

export const AddFlight = new Command(
  {
    __filename,
    aggregate: FlightAggregate,
    intent: AddFlightIntent,
    events: [FlightAddedEvent]
  },
  async (command, aggregate) => {
    const { state, events } = await aggregate.get(command.flightNo)

    if (events.length > 0) {
      throw new Error("cannot create a flight that already exists")
    }

    return [
      new FlightAddedEvent({
        ...command
      })
    ]
  }
)

export class CancelFlightIntent extends Shape("CancelFlightIntent", {
  flightNo: string(),
  day: string()
}) {}

export const CancelFlight = new Command(
  {
    __filename,
    aggregate: FlightAggregate,
    intent: CancelFlightIntent,
    events: [FlightCancelled]
  },
  async (command, aggregate) => {
    return [new FlightCancelled(command)]
  }
)

export const MyPolicy = new Policy(
  {
    __filename,
    events: [ScheduledFlightsAdded, FlightCancelled],
    commands: []
  },
  async event => {
    console.log(JSON.stringify(event, null, 2))
  }
)

export const operations = new BoundedContext({
  handler: "operations",
  name: "Operations",
  components: {
    AddFlight,
    CancelFlight,
    MyPolicy,
    FlightAggregate
  }
})
