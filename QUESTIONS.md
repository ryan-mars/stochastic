## General Questions

- How does an event handler manage it's own subscription without a control channel?
- Assume we deploy a new readmodel. How does it read from the event log and how does it know it's up to date enough to start listening to the SQS queue?
- How do we avoid interleaving of live events and replay?
- How do we maintain eventual consistency when dealing with events from outside the BC?
- How do we deal with the massive concurrency potential of Lambda?

- Have RebookingPolicy react to FlightLanded by grabbing the manifest, and executing the business logic to find rebooking options, prioritize them and issue rebooking commands.
- Then there's the issue of reservations that (for some reason) arrive into a cancelled flight (eventual consistency).

## Rebooking passengers after a flight cancellation

Rebooking passengers in the event of a cancelled flight presents an interesting design choice.

**Scenario:**

When a flight is cancelled a rebooking policy is activated to re-seat the affected passengers according to a set of business rules. The business rules are not the most significant constraint on design, correctness (eventual consistency) is.

Eventual consistency is aided by the fact that events are ordered per the aggregate, within the same bounded context. Events originating from other bounded contexts may arrive at any time. Therein lies a problem.

**Background:**

- The Reservations BC is responsible for creating passenger reservations. A reservation has a list of flights.
- The Operations BC is responsible for the daily operation of flights including boarding, delays, cancellations, etc...
- Reservations would like to swiftly rebook passengers on the next available flight headed to their destination in the event of a flight cancellation. The purpose is to avoid excessive calls to the call center and to increase customer satisfaction.

**Assertion #1**

If Reservation's rebooking policy receives a FlightCancelled event after all ReservationBooked events have flushed through the Reservations system then there is no problem. The policy would merely:

1. Query the now-current (consistent) flight manifest
2. Query the now-current list of scheduled flights with seat availability
3. Issue rebooking commands for each passenger on the manifest

**Assertion #2**

If Reservation's rebooking policy is triggered by a FlightCancelled event preceeding completed processing of ReservationBooked events then some passengers will not be automatically rebooked.

- Passenger 1 booked on flight 103
- Passenger 2 booked on flight 103
- Flight 103 cancelled
- Get passenger manifest for flight 103
- Rebook passengers 1 & 2 on flight 405
- Passenger 3 booked on flight 103

**Assertion #3**

Event replay within Reservations is further complicated by the need to interleave events arriving from outside the BC.

**Assumptions about the domain**

- Flight cancellations do not happen at a high volume but tend to be clustered when they do.
- Worst case example, 2.1 million Americans were traveling on 9/11/2001 when all flights were cancelled across the entire US (and for some following number of days if I recall)

**Assumptions about the system**

- Aggregate events are _currently_ time ordered with a KSUID
- Order of aggregate events _could_ be insured by some ordinal during command validation
- Optimistic concurrency _could_ be applied _at the Aggregate_ to insure commands are rejected/retried/merged when they lose the race
- Event reply _could_ be restricted to full history, controlled by the consuming event handler, therefore avoiding partial replay
- Aggregate events could arrive late but sould never arrive out of order
- Events arriving from outside the BC could arrive at any moment

**Potential Strategies:**

- Invoke the rebooking policy periodically, querying for passengers on cancelled flights.
  - How is the "passengers on cancelled flights" read model projected?
    - asdfasdf
  - To avoid race conditions you could restrict the concurrency of the policy
- Use distributed transactions
-
