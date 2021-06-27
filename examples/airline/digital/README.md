# Digital

Book a flight from the website

- Digital stitches GraphQL queries of the route schedule (from scheduling) with seat availability (from reservations)
- Digital creates a reservation with Reservations (graphql mutation)
- Digital creates a payment intent with Revenue (graphql mutation)
- The payment clears (from Stripe or something) and Revenue emits an event
- Reservations receives a payment event from Revenue and declares the reservation confirmed
- Digital sends an email to the customer after receiving the reservation confirmed event
