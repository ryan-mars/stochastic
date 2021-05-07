import {
  AddScheduledFlightCommandHandler,
  CreateFlightCommandHandler,
  FlightScheduleAggregate,
} from "./service";

describe("Scheduling service", () => {
  const flightCreated = {
    id: "1sC26Tx3VUi42mghcNopBYsRxD9",
    time: "2021-05-07T04:34:35.302Z",
    type: "FlightCreated" as const,
    payload: {
      flightNo: "PA576",
      aircraftType: "B787-9",
      origin: "SFO",
      destination: "MIA",
    },
  };
  const scheduledFlightAdded = {
    id: "1sC539ZsfhN9bHV4K8jZqtSz9bN",
    time: "2021-05-07T04:58:48.459Z",
    type: "ScheduledFlightAdded" as const,
    payload: {
      flightNo: "PA576",
      add: {
        day: "2021-06-11",
        scheduledArrival: new Date("2021-06-12T02:30:00.000Z"),
        scheduledDeparture: new Date("2021-06-11T20:30:00.000Z"),
      },
    },
  };
  it("should reduce aggregate state from events", () => {
    let state = FlightScheduleAggregate.reducer(
      FlightScheduleAggregate.initialState,
      flightCreated
    );
    state = FlightScheduleAggregate.reducer(state, scheduledFlightAdded);
    expect(state).toMatchSnapshot();
  });

  const undefinedAggregate = {
    get: async (key: string) => undefined,
  };

  it("creates a flight", async () => {
    const event = await CreateFlightCommandHandler.execute(
      {
        flightNo: "PA576",
        aircraftType: "B787-9",
        origin: "SFO",
        destination: "MIA",
      },
      undefinedAggregate
    );
    expect(event).toMatchSnapshot([
      {
        id: expect.any(String),
        time: expect.any(String),
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
      }
    );
    expect(event).toMatchSnapshot([
      {
        id: expect.any(String),
        time: expect.any(String),
      },
    ]);
  });
});
