import {
  AddScheduledFlightCommandHandler,
  CreateFlightCommandHandler,
  CreateFlightIntent,
  FlightCreatedEvent,
  FlightScheduleAggregate,
  ScheduledFlightAdded,
} from "./service";

describe("Scheduling service", () => {
  const flightCreated = new FlightCreatedEvent({
    payload: {
      flightNo: "PA576",
      aircraftType: "B787-9",
      origin: "SFO",
      destination: "MIA",
    },
    metadata: {
      id: "1sC26Tx3VUi42mghcNopBYsRxD9",
      time: new Date("2021-05-07T04:34:35.302Z"),
    },
  });
  const scheduledFlightAdded = new ScheduledFlightAdded({
    metadata: {
      id: "1sC539ZsfhN9bHV4K8jZqtSz9bN",
      time: new Date("2021-05-07T04:58:48.459Z"),
    },
    payload: {
      flightNo: "PA576",
      add: {
        day: "2021-06-11",
        scheduledArrival: new Date("2021-06-12T02:30:00.000Z"),
        scheduledDeparture: new Date("2021-06-11T20:30:00.000Z"),
      },
    },
  });
  it("should reduce aggregate state from events", () => {
    let state = FlightScheduleAggregate.reducer(FlightScheduleAggregate.initialState, flightCreated);
    state = FlightScheduleAggregate.reducer(state, scheduledFlightAdded);
    expect(state).toMatchSnapshot();
  });

  const undefinedAggregate = {
    get: async (key: string) => undefined,
  };

  it("creates a flight", async () => {
    const event = await CreateFlightCommandHandler.execute(
      new CreateFlightIntent({
        flightNo: "PA576",
        aircraftType: "B787-9",
        origin: "SFO",
        destination: "MIA",
      }),
      undefinedAggregate,
    );
    expect(event).toMatchSnapshot([
      {
        id: expect.any(String),
        time: expect.any(Date),
      },
    ]);
  });

  it("adds a scheduled flight", async () => {
    const event = await AddScheduledFlightCommandHandler.execute(
      {
        flightNo: "PA576",
        add: {
          scheduledDeparture: new Date("2021-06-11T12:30:00-08:00"),
          scheduledArrival: new Date("2021-06-11T21:30:00-05:00"),
          day: "2021-06-11",
        },
      },
      {
        get: async (key) => ({
          flightNo: "PA576",
          aircraftType: "B787-9",
          origin: "SFO",
          destination: "MIA",
          days: new Map(),
        }),
      },
    );
    expect(event).toMatchSnapshot([
      {
        id: expect.any(String),
        time: expect.any(Date),
      },
    ]);
  });
});
