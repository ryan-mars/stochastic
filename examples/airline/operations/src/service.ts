import { EventStorm, Policy } from "stochastic";
import { scheduling } from "scheduling/lib/index";

// const SchedulingBoundedContext = new ExternalBoundedContext({
//   boundedContext: scheduling,
// });

// const {
//   ScheduledFlightAddedEvent,
//   FlightCreatedEvent,
// } = SchedulingBoundedContext.events;

// export const FlightManagementPolicy = new Policy(
//   {
//     __filename,
//     events: [ScheduledFlightAddedEvent, FlightCreatedEvent],
//     commands: [AddFlight],
//   },
//   async (event, commands) => {
//     // ...
//   }
// );

// export const operations = new EventStorm({
//   handler: "operations",
//   name: "Operations",
//   components: {
//     SchedulingBoundedContext,
//     FlightManagementPolicy,
//     AddFlight,
//   },
// });
