import { Aggregate, Command, EventStorm, Shape } from "stochastic";
import { DomainEvent } from "stochastic/src/event";
import { object, record, string } from "superstruct";

export class FlightSchedule extends Shape("FlightSchedule", {
  flightNo: string(),
  aircraftType: string(),
  origin: string(),
  destination: string(),
  days: record(string(), object({ scheduledArrival: string(), scheduledDeparture: string() })),
}) {}

export class ScheduledFlightAdded extends DomainEvent("ScheduledFlightAdded", "flightNo", {
  flightNo: string(),
  add: object({
    day: string(),
    scheduledDeparture: string(),
    scheduledArrival: string(),
  }),
}) {}

export class FlightCreatedEvent extends DomainEvent("FlightCreated", "flightNo", {
  flightNo: string(),
  origin: string(),
  destination: string(),
  aircraftType: string(),
  days: record(string(), object({ scheduledArrival: string(), scheduledDeparture: string() })),
}) {}

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
          days: { ...state.days, [day]: { scheduledArrival, scheduledDeparture } },
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
      days: {},
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
    const latest = await aggregate.get(command.flightNo);
    console.log(JSON.stringify({ latest }, null, 2));
    if (latest.events.length > 0) {
      throw new Error("Can only create new flights that don't already exist");
    }

    return [new FlightCreatedEvent({ ...command, days: {} })];
  },
);

export class AddScheduledFlightIntent extends Shape("AddScheduledFlightIntent", {
  flightNo: string(),
  add: object({
    day: string(),
    scheduledDeparture: string(),
    scheduledArrival: string(),
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
    const { state: schedule, events } = await aggregate.get(command.flightNo);
    if (events.length === 0) {
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
