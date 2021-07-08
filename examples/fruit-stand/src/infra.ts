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

  console.log(result)

  fruitStand.eventStore.forEach((value, key) => {
    console.log("eventStore:", JSON.stringify({ [key]: value }, null, 2))
  })
}

main().then(console.log).catch(console.log)
