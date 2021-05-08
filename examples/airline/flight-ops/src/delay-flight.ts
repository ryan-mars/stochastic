import { Command } from "stochastic";
import { number, object, string } from "superstruct";
import { FlightDelayedEvent } from "./flight-delayed";
import { FlightsAggregate } from "./flights";

// export interface DelayFlight {
//   flightNo: string;
//   delayBy: number;
// }
export const DelayFlight = object({
  flightNo: string(),
  delayBy: number()
});

// TODO: change this to `new Command` instead of `flights.command`??
export const delayFlight = new Command({
  __filename,
  aggregate: FlightsAggregate,
  request: DelayFlight,
  events: [FlightDelayedEvent],
}, async (request, flights) => {
  const flight = await flights.get(request.flightNo);
  if (flight?.flightNo === "fucked") {
    throw new Error("fucked");
  }
  return [
    {
      type: "FlightDelayed",
      flightNo: request.flightNo,
      delayedBy: request.delayBy,
    } as const,
  ];
}) ;