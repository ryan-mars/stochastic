import { ByKeyReadModel } from "stochastic";
import { literal, object, string, union } from "superstruct";
import { FlightDelayedEvent } from "./flight-delayed";

// export interface FlightStatus {
//   flightNo: string;
//   status: "Delayed" | "Landed";
// }
export const FlightStatus = object({
  flightNo: string(),
  status: union([literal("Delayed"), literal("Landed")])
})
export const FlightStatusModel = new ByKeyReadModel({
  __filename,
  events: [FlightDelayedEvent],
  shape: FlightStatus,
  key: "flightNo",
}, (events, status) => {
  return {
    ...status,
    status: "Delayed",
  } as const;
});