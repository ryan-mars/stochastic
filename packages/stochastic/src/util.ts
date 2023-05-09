import { BoundedContext, Command, CommandResponse, Shape } from "."

type KeysOfType<T, K> = {
  [k in keyof T]: T[k] extends K ? k : never
}[keyof T]
export type CommandsFromContext<Context extends BoundedContext = BoundedContext> = {
  [k in KeysOfType<Context["components"], { kind: "Command" }>]: Context["components"][k] extends Command<
    any,
    infer Intent,
    infer Confirmation,
    infer Events
  >
    ? (intent: Shape.Value<Intent>) => Promise<CommandResponse<Confirmation, Events>>
    : never
}
