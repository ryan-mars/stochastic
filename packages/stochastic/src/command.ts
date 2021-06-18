import { Store, StoreInterface } from "./store"
import { BaseComponent, BaseComponentProps } from "./component"
import { DomainEvent } from "./event"
import { Init } from "./init"
import { Shape } from "./shape"

/**
 * A command accepts a message with the business intent, ensures
 * transactional consistency with the store and emits domain events.
 */
export interface CommandProps<
  State extends Store,
  Intent extends Shape,
  Confirmation extends Shape | undefined,
  Events extends readonly DomainEvent[],
> extends BaseComponentProps {
  readonly intent: Intent
  readonly confirmation: Confirmation
  readonly store: State
  readonly events: Events
}

export class Command<
  State extends Store = Store,
  Intent extends Shape = Shape,
  Confirmation extends Shape | undefined = Shape | undefined,
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
> extends BaseComponent {
  readonly kind: "Command" = "Command"
  readonly intent: Intent
  readonly confirmation: Confirmation
  readonly store: State
  readonly events: Events
  constructor(
    props: CommandProps<State, Intent, Confirmation, Events>,
    readonly init: Init<
      (intent: Shape.Value<Intent>, store: StoreInterface<State>) => Promise<CommandResponse<Confirmation, Events>>
    >,
  ) {
    super(props)
    this.intent = props.intent
    this.confirmation = props.confirmation!
    this.store = props.store
    this.events = props.events
  }
}

export type CommandResponse<Confirmation extends Shape | undefined, Events extends readonly DomainEvent[]> =
  Confirmation extends Shape
    ? {
        events: Shape.Value<Events[number]>[]
        confirmation: Shape.Value<Confirmation>
      }
    : Shape.Value<Events[number]>[]

export type CommandHandler<
  Intent extends Shape,
  Confirmation extends Shape | undefined,
  State extends Store,
  Events extends readonly DomainEvent[],
> = (
  intent: Intent,
  store: StoreInterface<State>,
) => Promise<CommandResponse<Confirmation, Shape.Value<Events[number]>[]>>

/**
 * The interface to a Command from a Policy
 */
export type CommandInterface<C extends Command> = (
  intent: Shape.Value<C["intent"]>,
) => Promise<C["confirmation"] extends Shape ? Shape.Value<C["confirmation"]> : undefined>
