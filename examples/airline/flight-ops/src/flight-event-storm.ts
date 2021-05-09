import { EventStorm } from "stochastic";
import { delayFlight } from "./delay-flight";
import { FlightDelayed } from "./flight-delayed";
import { FlightLanded } from "./flight-landed";
import { FlightStatusChanged } from "./policies";
import { FlightsAggregate } from "./flights";

// TODO: I think this can be moved to the Construct code since we de-coupled runtime from it.
export const flightEventStorm = new EventStorm({
  // name of the variable (^ above ^)
  handler: "flightEventStorm",
  // friendly name of the Event Storm app
  name: "Flight Operations",
  components: {
    flights: FlightsAggregate,
    FlightDelayed,
    FlightLanded,
    delayFlight,
    FlightStatusChanged,
  },
});

// TODO: some CDK (Pulumi, Terraform) stuff with myEventStorm
