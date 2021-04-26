import { EventStorm,} from "stochastic";
import { delayFlight } from "./delay-flight";
import { FlightDelayedEvent } from "./flight-delayed";
import { FlightLandedEvent } from "./flight-landed";
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
    FlightDelayedEvent,
    FlightLandedEvent,
    delayFlight,
    FlightStatusChanged,
  },
});

// TODO: some CDK (Pulumi, Terraform) stuff with myEventStorm
