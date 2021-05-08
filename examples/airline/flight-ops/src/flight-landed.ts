import {DomainEvent} from "stochastic";
import {date, literal, object, string} from "superstruct";

// export interface FlightLanded {
//   flightNo: string;
//   when: Date;
// }
// export const FlightLanded = object({
//   type: literal("FlightLanded"),
//   flightNo: string(),
//   when: date(),
// });

export class FlightLanded extends DomainEvent("FlightLanded", {
  payload: {
    flightNo: string(),
    when: date(),
  },
}) {}
// export const FlightLandedEvent = new Event("FlightLanded", FlightLanded);
