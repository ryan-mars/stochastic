# Flight Ops Example

Example service responsible for flight operations at a hypothetical airline.

## List of things we need (in small chunks)

- [ ] Figure out how we can give NodejsFunction the entry (file path) and handler (exported function name)
- [ ] POC of not having the entire graph defined in one file
- [ ] POC of handler -> NodejsFunction
- [ ] POC of passing dependent clients to a handler function
- [ ] Use SSM instead of environment variables for Lambda Function dependencies
- [ ] Command Handler Lambda or Ephemeral Command Handler?
- [ ] Pseudo code a CDK stack that uses (synthesizes?) an even storm in the stack constructor
- [ ] A CDK construct that takes an Event Storm and generates all of the actual CDK resources.
- [ ] Event Storm maintains a graph
- [ ] POC of working policy
- [ ] Store a domain event in DynamoDB
- [ ] Forward domain events to an SNS topic
- [ ] Subscribe event-handlers (policy, read-model updater) to filtered topic queue 
- [ ] Metabolism name?
- [ ] Identify certain events as public / can be subscribed to by outside services
- [ ] Publish public events to EventBridge
- [ ] Subscribe policy to public event from another Event Storm (using Event Bridge)
- [ ] Add a HTTP API to an event storm
- [ ] Add a GraphQL API to an event storm
- [ ] Modify CDK resources created by a synthesized Event Storm (aspect oriented?)

## Design Concepts

- Event Storm and it’s collaborators (Aggregate, Policy, Event, ReadModel, etc…) have zero CDK code in them (but may leverage types for storing configuration?)
- An Event Storm “synthesizer” CDK Construct takes an Event Storm graph and creates the necessary infrastructure
