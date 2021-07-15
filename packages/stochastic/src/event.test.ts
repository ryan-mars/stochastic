import { string } from "superstruct"
import { DomainEvent, Shape } from "."

describe("DomainEvent ", () => {
  it("should have the correct __typename", () => {
    class EventA extends DomainEvent("EventA", "key", {
      key: string(),
      testValue: string(),
    }) {}

    class ShapeB extends Shape("ShapeB", {
      key: string(),
      testValue: string(),
    }) {}

    const shapeB = new ShapeB({ key: "foo", testValue: "bar" })
    const eventA = new EventA(shapeB)
    expect(eventA.__typename).toBe("EventA")
  })
})
