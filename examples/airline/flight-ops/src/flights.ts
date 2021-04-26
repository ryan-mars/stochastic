import { Aggregate } from "stochastic";
import { date, number, object, optional, string } from "superstruct";

// export interface Flight {
//   flightNo: string;
//   scheduledDeparture: Date;
//   delayed?: number;
//   on?: Date; // time landed
//   in?: Date; // time arrived terminal
//   up?: Date; // time airborne (off tarmac)
//   out?: Date; // time left terminal
// }

export const Flight = object({
  flightNo: string(),
  scheduledDeparture: date(),
  delayed: optional(number()),
  on: date(),
  in: date(),
  up: date(),
  out: date(),
});

export const FlightsAggregate = new Aggregate({
  __filename,
  key: "flightNo",
  shape: Flight
});