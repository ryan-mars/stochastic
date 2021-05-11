import { DomainEvent } from "stochastic";
import { number, string } from "superstruct";

// {
//   version: number,
//   id: string,
//   source: string,
//   time: string,
//   type: string,
//   payload: object
// }

export class FlightDelayed extends DomainEvent("FlightDelayed", "flightNo", {
  flightNo: string(),
  delayedBy: number(),
}) {}

// export const FlightDelayedEvent = new Event(
//   "FlightDelayed",
//   object({
//     type: literal("FlightDelayed"),
//     flightNo: string(),
//     delayedBy: number(),
//   }),
// );
