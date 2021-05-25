import { strictEqual } from "assert"
import { Store, Command, DomainEvent, Shape } from "stochastic"
import { number, string } from "superstruct"

export class WorldPassMilesAwarded extends DomainEvent("WorldPassMilesAwarded", "worldPassAccountNo", {
  worldPassAccountNo: string(),
  milesAdded: number()
}) {}

export class WorldPassAccount extends Shape("WorldPassAccount", {
  worldPassAccountNo: string(),
  status: string(),
  miles: number()
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
  initialState: () => new WorldPassAccount({ miles: 0, status: "No Status", worldPassAccountNo: "" })
})

export class AddMilesIntent extends Shape("AddMilesIntent", {
  worldPassAccountNo: string(),
  milesToAdd: number()
}) {}

export const AddMiles = new Command(
  {
    __filename,
    intent: AddMilesIntent,
    store: WorldPassAccountStore,
    events: [WorldPassMilesAwarded],
    confirmation: undefined
  },
  context => async (command, store) => {
    const { state } = await store.get(command.worldPassAccountNo)
    // .. check state before ...
    return [
      new WorldPassMilesAwarded({ worldPassAccountNo: command.worldPassAccountNo, milesAdded: command.milesToAdd })
    ]
  }
)
