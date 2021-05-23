import { BaseComponent, BaseComponentProps, Component } from "./component"
import { Dependency, DependencyRuntime } from "./dependencies"
import { DomainEvent } from "./event"
import { Shape } from "./shape"

export interface EventHandlerProps<E extends readonly DomainEvent[], D extends readonly Dependency[] = Dependency[]>
  extends BaseComponentProps {
  readonly events: E
  readonly dependencies?: D
}

export abstract class BaseEventHandler<
  E extends readonly DomainEvent[],
  D extends readonly Dependency[]
> extends BaseComponent {
  readonly events: E
  readonly dependencies: D

  constructor(
    props: EventHandlerProps<E, D>,
    readonly handle: (
      dependencies: DependencyRuntime<D>,
      context: any
    ) => (event: Shape.Value<E[number]>) => Promise<void>
  ) {
    super(props)
    this.events = props.events
    this.dependencies = (props.dependencies ?? []) as D
  }
}

export class EventHandler<
  E extends readonly DomainEvent[] = DomainEvent[],
  D extends readonly Dependency[] = Dependency[]
> extends BaseEventHandler<E, D> {
  readonly kind: "EventHandler" = "EventHandler"
}
