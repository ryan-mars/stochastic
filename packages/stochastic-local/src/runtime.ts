import {
  Store,
  BoundedContext,
  BoundedContextConfig,
  CreatedEvents,
  Command,
  Component,
  Policy,
  ConsumedEvents,
  ReadModel,
  EventHandler,
  Query,
  Shape,
  CommandResponse,
} from "stochastic"

type KeysOfType<T, K> = { [k in keyof T]: T[k] extends K ? k : never }[keyof T]
type CommandsFromContext<Context extends BoundedContext = BoundedContext> = {
  [k in KeysOfType<Context["components"], { kind: "Command" }>]: Context["components"][k] extends Command<
    any,
    infer Intent,
    infer Confirmation,
    infer Events
  >
    ? (intent: Shape.Value<Intent>) => Promise<CommandResponse<Confirmation, Events>>
    : never
}

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
