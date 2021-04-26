import { Policy } from "stochastic";
import { delayFlight } from "./delay-flight";
import { FlightDelayedEvent } from "./flight-delayed";
import { FlightLandedEvent } from "./flight-landed";

export const FlightStatusChanged = new Policy({
  __filename,
  commands: [delayFlight],
  events: [FlightDelayedEvent, FlightLandedEvent],
}, async (event, delayFlight) => {
  const result = await delayFlight({
    flightNo: "flight",
    delayBy: 1
  });
});

