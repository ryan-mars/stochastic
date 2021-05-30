import { BaseComponent, BaseComponentProps } from "./component"
import { DomainEvent, DomainEventEnvelope } from "./event"
import { Shape } from "./shape"

export interface StoreProps<
  T extends Shape = Shape,
  Key extends keyof Shape.Value<T> = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
> extends BaseComponentProps {
  readonly stateShape: T
  readonly stateKey: Key
  readonly events: Events
  readonly reducer: (state: Shape.Value<T>, event: Shape.Value<Events[number]>) => Shape.Value<T>
  readonly initialState: () => Shape.Value<T>
}

export class Store<
  T extends Shape = Shape,
  Key extends keyof Shape.Value<T> = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
> extends BaseComponent {
  readonly events: Events
  readonly kind: "Store" = "Store"
  readonly stateShape: T
  readonly stateKey: Key
  readonly reducer: (state: Shape.Value<T>, event: Shape.Value<Events[number]>) => Shape.Value<T>
  readonly initialState: () => Shape.Value<T>
  constructor(props: StoreProps<T, Key, Events>) {
    super(props)
    this.events = props.events
    this.reducer = props.reducer
    this.initialState = props.initialState
    this.stateKey = props.stateKey
    this.stateShape = props.stateShape
  }
}

export type StoreInterface<A extends Store> = {
  get: (
    key: Shape.Value<A["stateShape"]>[A["stateKey"]],
  ) => Promise<{ state: Shape.Value<A["stateShape"]>; events: DomainEventEnvelope<Shape.Value<A["events"][number]>>[] }>
}
