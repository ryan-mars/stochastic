import { BoundedContext } from "stochastic";
import { scheduling } from "scheduling/lib/cjs/index";

console.log(scheduling.components.FlightCreatedEvent.__typename);

export const booking = new BoundedContext({
  handler: "booking",
  name: "Booking",
  components: {},
});
