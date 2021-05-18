import { Aggregate, BoundedContext, Command, DomainEvent, Policy, Shape } from "stochastic";
import { ScheduledFlightsAdded } from "scheduling";
import { string } from "superstruct";

const flightScheduleDetail = {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
  tailNo: string(),
  departureTime: string(),
  arrivalTime: string()
}

export class AddFlight extends Shape("AddFlight", flightScheduleDetail) { }

export class FlightAddedEvent extends DomainEvent("FlightAdded", "flightNo", flightScheduleDetail) { }

export class OperatedFlight extends Shape("OperatedFlight", {
  flightNo: string()
}) { }

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

export const AddFlightCommand = new Command({
  __filename,
  aggregate: FlightAggregate,
  intent: AddFlight,
  events: [FlightAddedEvent],
}, async (command, aggregate) => {
  const { state, events } = await aggregate.get(command.flightNo)

  if (events.length > 0) {
    throw new Error("cannot create a flight that already exists")
  }

  return [new FlightAddedEvent({
    ...command
  })]

})

export const MyPolicy = new Policy({
  __filename,
  events: [ScheduledFlightsAdded],
  commands: []
}, async (event) => {
  console.log(JSON.stringify(event, null, 2))
})

export const operations = new BoundedContext({
  handler: "operations",
  name: "Operations",
  components: {
    AddFlightCommand,
    MyPolicy,
    FlightAggregate,
    ScheduledFlightsAdded
  },
});
