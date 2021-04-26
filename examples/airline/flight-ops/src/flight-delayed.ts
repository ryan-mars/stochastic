import { Event } from "stochastic";
import { literal, number, object, string } from "superstruct";

// {
//   version: number,
//   id: string, 
//   source: string, 
//   time: string,
//   type: string, 
//   payload: object
// }

export const FlightDelayedEvent = new Event("FlightDelayed", object({
  type: literal("FlightDelayed"),
  flightNo: string(),
  delayedBy: number()
}));

