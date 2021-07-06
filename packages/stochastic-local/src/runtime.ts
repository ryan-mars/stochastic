import {
  Store,
  BoundedContext,
  BoundedContextConfig,
  CreatedEvents,
  Component,
  Policy,
  ConsumedEvents,
  ReadModel,
  EventHandler,
  Query,
} from "stochastic"
import { CommandsFromContext } from "stochastic"

export class LocalRuntime<Context extends BoundedContext = BoundedContext> {
  public readonly commands: CommandsFromContext<Context>

  constructor(props: { boundedContext: Context }) {
    const { boundedContext } = props

    ;(this.commands as any) = {}

    for (const [componentName, component] of Object.entries(boundedContext.components).sort(
      ([nameA, componentA], [nameB, componentB]) => (componentA.kind === "Command" ? -1 : 1),
    )) {
      if (component.kind === "Command") {
        ;(this.commands as any)[componentName] = async (intent: any) => {
          console.log({ componentName })
          console.log({ intent })
          const store = {
            get: async () => {
              return {
                state: {},
                events: [
                  {
                    type: "",
                    id: "",
                    time: new Date(),
                    source: "",
                    source_id: "",
                    payload: {},
                  },
                ],
              }
            },
          }
          return component.init(undefined)(intent, store)
        }
      }
    }
  }
}
