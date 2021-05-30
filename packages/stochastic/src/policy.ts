import { Command } from "./command"
import { BaseComponent, BaseComponentProps } from "./component"
import { DomainEvent } from "./event"
import { Init } from "./init"
import { ReadModel, ReadModelInterface } from "./read-model"
import { Shape } from "./shape"

export interface PolicyProps<
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
  Commands extends Record<string, Command> = Record<string, Command>,
  ReadModels extends Record<string, ReadModel> = Record<string, ReadModel>,
> extends BaseComponentProps {
  readonly events: Events
  readonly commands: Commands
  readonly reads: ReadModels
}

export class Policy<
  Name extends string = string,
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
  Commands extends Record<string, Command> = any,
  ReadModels extends Record<string, ReadModel> = any,
> extends BaseComponent {
  readonly kind: "Policy" = "Policy"
  readonly events: Events
  readonly commands: Commands
  readonly reads: ReadModels

  constructor(
    props: PolicyProps<Events, Commands, ReadModels>,
    readonly init: Init<Policy.Handler<Events, Commands, ReadModels>>,
  ) {
    super(props)
    this.events = props.events
    this.commands = props.commands
    this.reads = props.reads
  }
}

export namespace Policy {
  export type Handler<
    E extends readonly DomainEvent[],
    C extends Record<string, Command>,
    R extends Record<string, ReadModel>,
  > = (
    event: Shape.Value<E[number]>,
    commands: {
      [i in keyof C]: C[i] extends Command
        ? (
            intent: Shape.Value<C[i]["intent"]>,
          ) => Promise<
            C[i]["confirmation"] extends Shape ? Shape.Value<Exclude<C[i]["confirmation"], undefined>> : undefined
          >
        : C[i]
    },
    readModels: {
      [i in keyof R]: R[i] extends ReadModel ? ReadModelInterface<R[i]> : R[i]
    },
    context: any,
  ) => Promise<void>
}
