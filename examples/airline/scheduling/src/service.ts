import { Aggregate, Command, BoundedContext, Shape, Policy, DomainEvent } from "stochastic"
import { array, map, object, record, set, string } from "superstruct"

export class AddRoute extends Shape("AddRoute", { route: string() }) {}
export class RouteAdded extends DomainEvent("RouteAdded", "route", {
  route: string()
}) {}

const flightMeta = {
  day: string(),
  flightNo: string()
}
const flightDetail = {
  ...flightMeta,
  departureTime: string(),
  arrivalTime: string()
}
export class AddFlights extends Shape("AddFlights", {
  route: string(),
  flights: array(object(flightDetail))
}) {}
export class ScheduledFlightsAdded extends DomainEvent("ScheduledFlightsAdded", "route", {
  route: string(),
  flights: array(object(flightDetail))
}) {}
export class RemoveFlights extends Shape("RemoveFlights", {
  route: string(),
  flights: array(object(flightMeta))
}) {}
export class FlightsRemoved extends DomainEvent("FlightsRemoved", "route", {
  route: string(),
  flights: array(object(flightMeta))
}) {}
export class UpdateFlights extends Shape("UpdateFlights", {
  route: string(),
  flights: array(object(flightDetail))
}) {}
export class FlightsUpdated extends DomainEvent("FlightsUpdated", "route", {
  route: string(),
  flights: array(object(flightDetail))
}) {}

export class RouteSchedule extends Shape("RouteSchedule", {
  route: string(),
  //days: map(string(), object(flightDetail))
  flights: array(object(flightDetail))
}) {}

export const RouteScheduleAggregate = new Aggregate({
  __filename,
  stateKey: "route",
  stateShape: RouteSchedule,
  events: [ScheduledFlightsAdded, FlightsRemoved, FlightsUpdated, RouteAdded],
  reducer: (state, event) => {
    switch (event.__typename) {
      case "RouteAdded":
        const { route } = event
        return new RouteSchedule({ ...state, route })
      case "ScheduledFlightsAdded":
        return new RouteSchedule({
          ...state,
          flights: [...state.flights, ...event.flights]
        })
      case "FlightsRemoved":
        return new RouteSchedule({
          ...state,
          flights: state.flights.filter(sf =>
            event.flights.find(ef => ef.day === sf.day && ef.flightNo === sf.flightNo)
          )
        })
      default:
        return state
    }
  },
  initialState: () => new RouteSchedule({ route: "", flights: [] })
})

class AddRouteConfirmation extends Shape("AddRouteConfirmation", {}) {}

export const AddRouteCommand = new Command(
  {
    __filename,
    events: [RouteAdded],
    intent: AddRoute,
    confirmation: AddRouteConfirmation,
    state: RouteScheduleAggregate
  },
  context => async (command, aggregate) => {
    const { route } = command
    const { state, events } = await aggregate.get(route)
    if (events.length > 0) {
      throw new Error(`Route ${route} already exists`)
    }

    return {
      events: [new RouteAdded({ route })],
      confirmation: new AddRouteConfirmation({})
    }
  }
)

export const AddFlightsCommand = new Command(
  {
    __filename,
    events: [ScheduledFlightsAdded],
    intent: AddFlights,
    confirmation: undefined,
    state: RouteScheduleAggregate
  },
  context => async (command, aggregate) => {
    return [new ScheduledFlightsAdded(command)]
  }
)

export const RemoveFlightsCommand = new Command(
  {
    __filename,
    events: [FlightsRemoved],
    intent: RemoveFlights,
    confirmation: undefined,
    state: RouteScheduleAggregate
  },
  context => async (command, aggregate) => {
    return [new FlightsRemoved(command)]
  }
)

export const scheduling = new BoundedContext({
  handler: "scheduling",
  name: "Scheduling",
  components: {
    RouteScheduleAggregate,
    AddFlightsCommand,
    AddRouteCommand,
    RemoveFlightsCommand
  },
  emits: [ScheduledFlightsAdded, FlightsRemoved]
})
