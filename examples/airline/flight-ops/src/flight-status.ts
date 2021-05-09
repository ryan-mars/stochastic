import { ByKeyReadModel, Shape } from "stochastic";
import { literal, object, string, union } from "superstruct";
import { FlightDelayed } from "./flight-delayed";

// export interface FlightStatus {
//   flightNo: string;
//   status: "Delayed" | "Landed";
// }
export class FlightStatus extends Shape("FlightStatus", {
  flightNo: string(),
  status: union([literal("Delayed"), literal("Landed")]),
}) {}
export const FlightStatusModel = new ByKeyReadModel(
  {
    __filename,
    events: [FlightDelayed],
    shape: FlightStatus,
    key: "flightNo",
  },
  (events, status) => {
    return {
      ...status,
      status: "Delayed",
    } as const;
  },
);
