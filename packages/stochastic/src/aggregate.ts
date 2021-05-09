import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";
import { Shape } from "./shape";

export interface AggregateProps<
  T extends Shape = Shape,
  Key extends keyof Shape.Value<T> = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponentProps {
  readonly stateShape: T;
  readonly stateKey: Key;
  readonly events: Events;
  readonly reducer: (state: Shape.Value<T>, event: Shape.Value<Events[number]>) => Shape.Value<T>;
  readonly initalState: () => Shape.Value<T>;
}

export class Aggregate<
  T extends Shape = Shape,
  Key extends keyof Shape.Value<T> = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponent {
  readonly kind: "Aggregate" = "Aggregate";
  readonly stateType: T;
  readonly stateKey: Key;
  readonly reducer: (state: Shape.Value<T>, event: Shape.Value<Events[number]>) => Shape.Value<T>;
  readonly initialState: () => Shape.Value<T>;
  constructor(props: AggregateProps<T, Key, Events>) {
    super(props);
    this.reducer = props.reducer;
    this.initialState = props.initalState;
  }
}

export type AggregateInterface<A extends Aggregate> = {
  get: (key: Shape.Value<A["stateType"]>[A["stateKey"]]) => Promise<Shape.Value<A["stateType"]> | undefined>;
};
