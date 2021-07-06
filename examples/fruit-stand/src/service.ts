import { BoundedContext, Command, DomainEvent, Shape, Store } from "stochastic"
import { string } from "superstruct"

class CustomerArrived extends DomainEvent("CustomerArrived", "orderNo", {
  orderNo: string(),
  stallNo: string(),
  arrivalTime: string(),
}) {}

class Order extends Shape("Order", {
  orderNo: string(),
  items: string(),
}) {}

const orderStore = new Store({
  __filename,
  stateShape: Order,
  stateKey: "orderNo",
  events: [CustomerArrived],
  reducer: (state, event) => state,
  initialState: () =>
    new Order({
      orderNo: "",
      items: "",
    }),
})

export class CheckCustomerInIntent extends Shape("CheckCustomerInIntent", {
  orderNo: string(),
  arrivalTime: string(),
  stallNo: string(),
}) {}

const checkCustomerInCommand = new Command(
  {
    __filename,
    intent: CheckCustomerInIntent,
    events: [CustomerArrived],
    store: orderStore,
    confirmation: undefined,
  },
  context => async (command, store) => {
    return [new CustomerArrived(command)]
  },
)

export const fruitStand = new BoundedContext({
  handler: "fruitStand",
  name: "FruitStand",
  components: {
    checkCustomerInCommand,
    orderStore,
  },
})
