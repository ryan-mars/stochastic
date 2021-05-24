import { DomainEventEnvelope } from "stochastic"
import {
  RouteAdded,
  ScheduledFlightsAdded,
  RouteScheduleAggregate,
  AddRouteCommand,
  AddRoute,
  AddFlightsCommand,
  AddFlights,
  RouteSchedule
} from "./service"

describe("Scheduling service", () => {
  const routeAdded = new DomainEventEnvelope({
    id: "1sC26Tx3VUi42mghcNopBYsRxD9",
    time: new Date("2021-05-07T04:34:35.302Z"),
    source: "RouteSchedule",
    source_id: "SFO-MIA",
    payload: new RouteAdded({
      route: "SFO-MIA"
    })
  })
  const scheduledFlightsAdded = new DomainEventEnvelope({
    id: "1sC539ZsfhN9bHV4K8jZqtSz9bN",
    time: new Date("2021-05-07T04:58:48.459Z"),
    source: "FlightScheduleAggregate",
    source_id: "PA576",
    payload: new ScheduledFlightsAdded({
      route: "SFO-MIA",
      flights: [
        {
          day: "2021-06-11",
          flightNo: "PA576",
          arrivalTime: "928p",
          departureTime: "1210p"
        },
        {
          day: "2021-06-11",
          flightNo: "PA872",
          arrivalTime: "502p",
          departureTime: "700a"
        },
        {
          day: "2021-06-11",
          flightNo: "PA738",
          arrivalTime: "513p",
          departureTime: "700a"
        },
        {
          day: "2021-06-12",
          flightNo: "PA576",
          arrivalTime: "928p",
          departureTime: "1210p"
        },
        {
          day: "2021-06-12",
          flightNo: "PA872",
          arrivalTime: "502p",
          departureTime: "700a"
        },
        {
          day: "2021-06-12",
          flightNo: "PA738",
          arrivalTime: "513p",
          departureTime: "700a"
        }
      ]
    })
  })

  it("reduces state from events", () => {
    let state = [routeAdded.payload, scheduledFlightsAdded.payload].reduce(
      RouteScheduleAggregate.reducer,
      RouteScheduleAggregate.initialState()
    )
    expect(state).toMatchSnapshot()
  })

  it("adds routes", async () => {
    const command = AddRouteCommand.init({})
    const event = await command(
      new AddRoute({
        route: "SFO-MIA"
      }),
      {
        get: async (key: string) => ({ state: undefined as any, events: [] })
      }
    )
    expect(event).toMatchSnapshot()
  })

  it("adds a scheduled flight", async () => {
    const command = AddFlightsCommand.init({})
    const event = await command(
      new AddFlights(
        new ScheduledFlightsAdded({
          route: "SFO-MIA",
          flights: [
            {
              day: "2021-06-11",
              flightNo: "PA576",
              arrivalTime: "928p",
              departureTime: "1210p"
            },
            {
              day: "2021-06-11",
              flightNo: "PA872",
              arrivalTime: "502p",
              departureTime: "700a"
            }
          ]
        })
      ),
      {
        get: async (key: string) => ({
          state: new RouteSchedule({
            route: "SFO-MIA",
            flights: []
          }),
          events: [routeAdded]
        })
      }
    )
    expect(event).toMatchSnapshot()
  })
})
