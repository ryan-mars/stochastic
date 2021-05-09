import { Command, Shape } from "stochastic";
import { number, string } from "superstruct";
import { FlightDelayed } from "./flight-delayed";
import { FlightsAggregate } from "./flights";

export class DelayFlight extends Shape("DelayFlight", {
  flightNo: string(),
  delayBy: number(),
}) {}

// TODO: change this to `new Command` instead of `flights.command`??
export const delayFlight = new Command(
  {
    __filename,
    aggregate: FlightsAggregate,
    intent: DelayFlight,
    events: [FlightDelayed],
  },
  async (request, flights) => {
    const flight = await flights.get(request.flightNo);
    if (flight?.flightNo === "fucked") {
      throw new Error("fucked");
    }

    return [
      new FlightDelayed({
        flightNo: request.flightNo,
        delayedBy: request.delayBy,
      }),
    ];
  },
);
