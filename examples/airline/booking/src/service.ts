import { BoundedContext } from "stochastic";
import { scheduling } from "scheduling/lib/index";



export const booking = new BoundedContext({
  handler: "booking",
  name: "Booking",
  components: {},
});
