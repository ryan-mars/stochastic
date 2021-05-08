import { EventStorm } from "stochastic";

export const booking = new EventStorm({
  handler: "booking",
  name: "Booking",
  components: {},
});
