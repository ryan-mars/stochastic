import { LocalRuntime } from "../runtime"
import { CheckCustomerInIntent, fruitStand } from "./__fixture__/fruit-stand"

jest.useFakeTimers("modern")
describe("runtime", () => {
  describe("command", () => {
    jest.setSystemTime(1482363367071)
    let bc: LocalRuntime<typeof fruitStand>
    let commandResult: any
    beforeEach(async () => {
      bc = new LocalRuntime({ boundedContext: fruitStand })
      commandResult = await bc.commands.checkCustomerInCommand(
        new CheckCustomerInIntent({
          orderNo: "1234",
          arrivalTime: new Date().toISOString(),
          stallNo: "03",
        }),
      )
    })
    it("returns the event", () => {
      expect(commandResult).toMatchSnapshot([
        {
          id: expect.any(String),
        },
      ])
    })
    it("stores the event", () => {
      expect(bc.eventStore.get("Order#1234")).toStrictEqual(commandResult)
    })
  })
})
