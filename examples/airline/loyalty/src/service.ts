import {
  BoundedContext,
  Command,
  Config,
  ConfigRuntime,
  DomainEvent,
  DomainEventEnvelope,
  Policy,
  ReadModel,
  Shape,
  Store,
} from "stochastic"
import { number, string } from "superstruct"
import { FlightArrived } from "operations"
import { DynamoDBConfigBinding } from "stochastic-aws-serverless"

export class WorldPassMilesAwarded extends DomainEvent("WorldPassMilesAwarded", "worldPassAccountNo", {
  worldPassAccountNo: string(),
  milesAdded: number(),
}) {}

export class WorldPassAccount extends Shape("WorldPassAccount", {
  worldPassAccountNo: string(),
  status: string(),
  miles: number(),
}) {}

export const WorldPassAccountStore = new Store({
  __filename,
  stateShape: WorldPassAccount,
  stateKey: "worldPassAccountNo",
  events: [WorldPassMilesAwarded],
  reducer: (state, event) => {
    if (event.__typename === "WorldPassMilesAwarded") {
      return new WorldPassAccount({ ...state, miles: state.miles + event.milesAdded })
    }
    return state
  },
  initialState: () => new WorldPassAccount({ miles: 0, status: "No Status", worldPassAccountNo: "" }),
})

export class AddMilesIntent extends Shape("AddMilesIntent", {
  worldPassAccountNo: string(),
  milesToAdd: number(),
  idempotencyToken: string(),
}) {}

export const AddMiles = new Command(
  {
    __filename,
    intent: AddMilesIntent,
    store: WorldPassAccountStore,
    events: [WorldPassMilesAwarded],
    confirmation: undefined,
  },
  context => async (command, store) => {
    const { state } = await store.get(command.worldPassAccountNo)
    // .. check state before ...
    return [
      new WorldPassMilesAwarded({ worldPassAccountNo: command.worldPassAccountNo, milesAdded: command.milesToAdd }),
    ]
  },
)

type Projection = (
  dependencies: ConfigRuntime<Config<string, Shape<string, any>>[]>,
  context: any,
) => (event: DomainEventEnvelope<any>, context: any) => Promise<void>

const milesAwardedReadModelProjection: Projection = (deps, context) => async (event, context) => {
  // ...
}

const milesAwardedReadModelClient = async () => {
  // ...
}

export const MilesAwardedReadModel = new ReadModel({
  __filename,
  events: [WorldPassMilesAwarded],
  projection: milesAwardedReadModelProjection,
  client: milesAwardedReadModelClient,
})

export const PassengerManifest = new ReadModel({
  __filename,
  events: [WorldPassMilesAwarded],
  projection: () => {
    return async event => {}
  },
  client: () => async (props: { flightNo: string; day: string }) =>
    [{ name: "joe isuzu", worldPassAccountNo: "abc123" }],
})

export const MilesAwardPolicy = new Policy(
  {
    __filename,
    events: [FlightArrived],
    commands: {
      AddMiles,
    },
    reads: {
      PassengerManifest,
    },
  },
  context => async (event, commands, readmodels) => {
    const { flightNo, day } = event.payload
    const passengers = await readmodels.PassengerManifest({ flightNo, day })
    const promises = passengers.map(passenger =>
      commands.AddMiles(
        //TODO: Next need an idempotency token (SQS is at-least-once)
        new AddMilesIntent({
          worldPassAccountNo: passenger.worldPassAccountNo,
          milesToAdd: 100,
          idempotencyToken: event.id,
        }),
      ),
    )
    await Promise.all(promises)
  },
)

export const loyalty = new BoundedContext({
  handler: "loyalty",
  name: "Loyalty",
  components: {
    WorldPassAccountStore,
    AddMiles,
    MilesAwardPolicy,
  },
})
