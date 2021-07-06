import { LocalRuntime } from "stochastic-local"
import { CheckCustomerInIntent, fruitStand as boundedContext } from "./service"

const fruitStand = new LocalRuntime({ boundedContext })

async function main() {
  const result = await fruitStand.commands.checkCustomerInCommand(
    new CheckCustomerInIntent({
      orderNo: "1234",
      arrivalTime: new Date().toISOString(),
      stallNo: "03",
    }),
  )
  return result
}

main().then(console.log).catch(console.log)
