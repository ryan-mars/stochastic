import { EventStorm, Policy } from "stochastic";

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
