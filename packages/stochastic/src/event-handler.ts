import { BaseComponent, BaseComponentProps } from "./component"
import { Config, ConfigRuntime } from "./config"
import { DomainEvent } from "./event"
import { Shape } from "./shape"

export interface EventHandlerProps<E extends readonly DomainEvent[], C extends readonly Config[] = Config[]>
  extends BaseComponentProps {
  readonly events: E
  readonly config?: C
}

export abstract class BaseEventHandler<
  E extends readonly DomainEvent[],
  C extends readonly Config[],
> extends BaseComponent {
  readonly events: E
  readonly config: C

  constructor(
    props: EventHandlerProps<E, C>,
    readonly init: (
      config: ConfigRuntime<C>,
      context: any,
    ) => (event: Shape.Value<E[number]>, context: any) => Promise<void>,
  ) {
    super(props)
    this.events = props.events
    this.config = (props.config ?? []) as C
  }
}

export class EventHandler<
  E extends readonly DomainEvent[] = DomainEvent[],
  D extends readonly Config[] = Config[],
> extends BaseEventHandler<E, D> {
  readonly kind: "EventHandler" = "EventHandler"
}
