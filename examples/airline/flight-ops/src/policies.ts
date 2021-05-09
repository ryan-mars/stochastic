import { Policy } from "stochastic";
import { delayFlight } from "./delay-flight";
import { FlightDelayed } from "./flight-delayed";
import { FlightLanded } from "./flight-landed";

export const FlightStatusChanged = new Policy(
  {
    __filename,
    commands: [delayFlight],
    events: [FlightDelayed, FlightLanded],
  },
  async (event, delayFlight) => {
    if (event.__typename === "FlightDelayed") {
      event.payload.flightNo;
    } else {
      event.payload.when;
      new FlightDelayed({
        payload: {
          delayedBy: 1,
          flightNo: "",
        },
      });
    }

    const result = await delayFlight({
      flightNo: "flight",
      delayBy: 1,
    });
  },
);
