import { Aggregate, Command, EventStorm, Shape } from "stochastic";
import { DomainEvent } from "stochastic/src/event";
import { date, map, object, string } from "superstruct";

export class FlightSchedule extends Shape("FlightSchedule", {
  flightNo: string(),
  aircraftType: string(),
  origin: string(),
  destination: string(),
  days: map(string(), object({ scheduledDeparture: date(), scheduledArrival: date() })),
}) {}

export class ScheduledFlightAdded extends DomainEvent("ScheduledFlightAdded", {
  flightNo: string(),
  add: object({
    day: string(),
    scheduledDeparture: date(),
    scheduledArrival: date(),
  }),
}) {}

export class FlightCreatedEvent extends DomainEvent("FlightCreated", {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
}) {}

// TODO: These two lines have too much boiler plate

export const FlightScheduleAggregate = new Aggregate({
  __filename,
  stateKey: "flightNo",
  stateShape: FlightSchedule,
  events: [ScheduledFlightAdded, FlightCreatedEvent], // HERE
  reducer: (state, event) => {
    switch (event.__typename) {
      case "ScheduledFlightAdded":
        const {
          add: { day, scheduledDeparture, scheduledArrival },
        } = event;
        return new FlightSchedule({
          ...state,
          days: state.days.set(day, { scheduledArrival, scheduledDeparture }),
        });
      case "FlightCreated":
        return new FlightSchedule({ ...state, ...event });
      default:
        return state;
    }
  },
  initalState: () =>
    new FlightSchedule({
      flightNo: "",
      aircraftType: "",
      origin: "",
      destination: "",
      days: new Map(),
    }),
});

export class CreateFlightIntent extends Shape("CreateFlightIntent", {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
}) {}

export const CreateFlightCommandHandler = new Command(
  {
    __filename,
    aggregate: FlightScheduleAggregate,
    intent: CreateFlightIntent,
    events: [FlightCreatedEvent],
  },
  async (command, aggregate) => {
    const flight = await aggregate.get(command.flightNo);
    if (flight) {
      throw "Can only create new flights that don't already exist";
    }

    return [new FlightCreatedEvent(command)];
  },
);

export class AddScheduledFlightIntent extends Shape("AddScheduledFlightIntent", {
  flightNo: string(),
  add: object({
    day: string(),
    scheduledDeparture: date(),
    scheduledArrival: date(),
  }),
}) {}

export const AddScheduledFlightCommandHandler = new Command(
  {
    __filename,
    aggregate: FlightScheduleAggregate,
    intent: AddScheduledFlightIntent,
    events: [ScheduledFlightAdded],
  },
  async (command, aggregate) => {
    const schedule = await aggregate.get(command.flightNo);
    if (!schedule) {
      throw new Error("Can't find flight");
    }

    const {
      flightNo,
      add: { scheduledArrival, scheduledDeparture, day },
    } = command;

    return [
      new ScheduledFlightAdded({
        flightNo,
        add: {
          day,
          scheduledArrival,
          scheduledDeparture,
        },
      }),
    ];
  },
);

// TODO: This EventStorm should instead be a BoundedContext. Bounded Context should be able to stand alone. EventStorm is a semantic collection of BoundedContexts only necessary if trying to fit multiple BoundedContexts in the same app
export const scheduling = new EventStorm({
  handler: "scheduling",
  name: "Scheduling",
  components: {
    FlightScheduleAggregate,
    ScheduledFlightAdded,
    FlightCreatedEvent,
    CreateFlightCommandHandler,
    AddScheduledFlightCommandHandler,
  },
});
