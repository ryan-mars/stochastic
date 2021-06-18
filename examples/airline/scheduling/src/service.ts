import { BoundedContext, Command, DomainEvent, Shape, Store } from "stochastic"
import { array, number, object, string } from "superstruct"
import { Temporal } from "proposal-temporal"

export class AddRoute extends Shape("AddRoute", { route: string() }) {}
export class ScheduledRouteAdded extends DomainEvent("ScheduledRouteAdded", "route", {
  route: string(),
}) {}

export const AirportCode = {
  SFO: "SFO",
  MIA: "MIA",
} as const

export const AirportTZ = {
  SFO: Temporal.TimeZone.from("America/Los_Angeles"),
  MIA: Temporal.TimeZone.from("America/New_York"),
} as const

const flightMeta = {
  day: string(),
  flightNo: string(),
}
const flightDetail = {
  day: string(),
  flightNo: string(),
  departureTime: string(),
  arrivalTime: string(),
  aircraft: string(),
  seats: number(),
}
export class AddFlights extends Shape("AddFlights", {
  route: string(),
  origin: string(),
  destination: string(),
  flights: array(object(flightDetail)),
}) {}
export class ScheduledFlightsAdded extends DomainEvent("ScheduledFlightsAdded", "route", {
  route: string(),
  flights: array(object(flightDetail)),
}) {}
export class RemoveFlights extends Shape("RemoveFlights", {
  route: string(),
  flights: array(object(flightMeta)),
}) {}
export class ScheduledFlightsRemoved extends DomainEvent("ScheduledFlightsRemoved", "route", {
  route: string(),
  flights: array(object(flightMeta)),
}) {}
export class UpdateFlights extends Shape("UpdateFlights", {
  route: string(),
  flights: array(object(flightDetail)),
}) {}
export class ScheduledFlightsUpdated extends DomainEvent("ScheduledFlightsUpdated", "route", {
  route: string(),
  flights: array(object(flightDetail)),
}) {}

export class RouteSchedule extends Shape("RouteSchedule", {
  route: string(),
  //days: map(string(), object(flightDetail))
  flights: array(object(flightDetail)),
}) {}

export const RouteScheduleStore = new Store({
  __filename,
  stateKey: "route",
  stateShape: RouteSchedule,
  events: [ScheduledFlightsAdded, ScheduledFlightsRemoved, ScheduledFlightsUpdated, ScheduledRouteAdded],
  reducer: (state, event) => {
    switch (event.__typename) {
      case "ScheduledRouteAdded":
        const { route } = event
        return new RouteSchedule({ ...state, route })
      case "ScheduledFlightsAdded":
        return new RouteSchedule({
          ...state,
          flights: [...state.flights, ...event.flights],
        })
      case "ScheduledFlightsRemoved":
        return new RouteSchedule({
          ...state,
          flights: state.flights.filter(sf =>
            event.flights.find(ef => ef.day === sf.day && ef.flightNo === sf.flightNo),
          ),
        })
      default:
        return state
    }
  },
  initialState: () => new RouteSchedule({ route: "", flights: [] }),
})

class AddRouteConfirmation extends Shape("AddRouteConfirmation", {}) {}

export const AddRouteCommand = new Command(
  {
    __filename,
    events: [ScheduledRouteAdded],
    intent: AddRoute,
    //confirmation: AddRouteConfirmation,
    confirmation: undefined,
    store: RouteScheduleStore,
  },
  context => async (command, store) => {
    const { route } = command
    const { state, events } = await store.get(route)
    if (events.length > 0) {
      throw new Error(`Route ${route} already exists`)
    }

    // Alternatively you can return a confirmation
    // return {
    //   events: [new ScheduledRouteAdded({ route })],
    //   confirmation: new AddRouteConfirmation({})
    // }
    return [new ScheduledRouteAdded({ route })]
  },
)

export const AddFlightsCommand = new Command(
  {
    __filename,
    events: [ScheduledFlightsAdded],
    intent: AddFlights,
    confirmation: undefined,
    store: RouteScheduleStore,
  },
  context => async (command, store) => {
    return [new ScheduledFlightsAdded(command)]
  },
)

export const RemoveFlightsCommand = new Command(
  {
    __filename,
    events: [ScheduledFlightsRemoved],
    intent: RemoveFlights,
    confirmation: undefined,
    store: RouteScheduleStore,
  },
  context => async (command, store) => {
    return [new ScheduledFlightsRemoved(command)]
  },
)

export const scheduling = new BoundedContext({
  handler: "scheduling",
  name: "Scheduling",
  components: {
    RouteScheduleStore,
    AddRouteCommand,
    AddFlightsCommand,
    RemoveFlightsCommand,
  },
  emits: [ScheduledFlightsAdded, ScheduledFlightsRemoved, ScheduledRouteAdded],
})
