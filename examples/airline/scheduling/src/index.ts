import { Aggregate, Command, event, Event, EventStorm } from "stochastic";
import { date, map, object, omit, string } from "superstruct";
import KSUID from "ksuid";

const FlightSchedule = object({
  flightNo: string(),
  aircraftType: string(),
  origin: string(),
  destination: string(),
  days: map(
    string(),
    object({ scheduledDeparture: date(), scheduledArrival: date() })
  ),
});

export const FlightScheduleAggregate = new Aggregate({
  __filename,
  key: "flightNo",
  shape: FlightSchedule,
  reducer: (state, event) => {
    switch (event.__type) {
      case "ScheduledFlightAdded":
        const {
          payload: { day, scheduledDeparture, scheduledArrival },
        } = event;
        return {
          ...state,
          days: state.days.set(day, { scheduledArrival, scheduledDeparture }),
        };

      default:
        return state;
    }
  },
  initalState: {
    flightNo: "",
    aircraftType: "",
    origin: "",
    destination: "",
    days: new Map(),
  },
});

const ScheduledFlightAdded = event(
  "ScheduledFlightAdded",
  object({
    flightNo: string(),
    add: object({
      day: string(),
      scheduledDeparture: date(),
      scheduledArrival: date(),
    }),
    fullSchedule: FlightSchedule,
  })
);

export const ScheduledFlightAddedEvent = new Event(
  "ScheduledFlightAdded",
  ScheduledFlightAdded
);

const CreateFlightCommand = omit(FlightSchedule, ["days"]);

// TODO: These two lines have too much boiler plate
const FlightCreated = event("FlightCreated", CreateFlightCommand);
const FlightCreatedEvent = new Event("FlightCreated", FlightCreated);

export const CreateFlightCommandHandler = new Command(
  {
    __filename,
    aggregate: FlightScheduleAggregate,
    request: CreateFlightCommand,
    events: [FlightCreatedEvent],
  },
  async (command, aggregate) => {
    const flight = await aggregate.get(command.flightNo);
    if (flight) {
      throw "Can only create new flights that don't already exist";
    }

    return [
      {
        id: KSUID.randomSync().string,
        time: new Date().toISOString(),
        type: "FlightScheduleUpdated",
        payload: {
          ...command,
        },
      },
    ];
  }
);

const AddScheduledFlightCommand = object({
  flightNo: string(),
  add: object({
    day: string(),
    scheduledDeparture: date(),
    scheduledArrival: date(),
  }),
});

export const AddScheduledFlightCommandHandler = new Command(
  {
    __filename,
    aggregate: FlightScheduleAggregate,
    request: AddScheduledFlightCommand,
    events: [ScheduledFlightAddedEvent],
  },
  async (command, aggregate) => {
    const schedule = await aggregate.get(command.flightNo);

    const {
      flightNo,
      add: { scheduledArrival, scheduledDeparture, day },
    } = command;

    // TODO: Helper function for creating events with metadata
    return [
      {
        id: KSUID.randomSync().string,
        time: new Date().toISOString(),
        type: "FlightScheduleUpdated",
        payload: {
          flightNo,
          add: {
            day,
            scheduledArrival,
            scheduledDeparture,
          },
          fullSchedule: schedule,
        },
      },
    ];
  }
);

// TODO: This EventStorm should instead be a BoundedContext. Bounded Context should be able to stand alone. EventStorm is a semantic collection of BoundedContexts only necessary if trying to fit multiple BoundedContexts in the same app
export const scheduling = new EventStorm({
  handler: "scheduling",
  name: "Scheduling",
  components: {
    FlightScheduleAggregate,
    ScheduledFlightAddedEvent,
    CreateFlightCommandHandler,
    AddScheduledFlightCommandHandler,
  },
});
