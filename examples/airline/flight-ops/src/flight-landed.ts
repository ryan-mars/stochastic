import { DomainEvent } from "stochastic";
import { date, string } from "superstruct";

export class FlightLanded extends DomainEvent("FlightLanded", {
  flightNo: string(),
  when: date(),
}) {}
