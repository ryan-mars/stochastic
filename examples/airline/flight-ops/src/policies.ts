import { Policy } from "stochastic";
import { DelayFlight, delayFlight } from "./delay-flight";
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
      event.flightNo;
    } else {
      event.when;
      new FlightDelayed({
        delayedBy: 1,
        flightNo: "",
      });
    }

    const result = await delayFlight(
      new DelayFlight({
        flightNo: "flight",
        delayBy: 1,
      }),
    );
  },
);
