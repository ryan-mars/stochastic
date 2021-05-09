import { Struct } from "superstruct";
import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";
import { TypeConstructor } from "./type";

export interface AggregateProps<
  T extends object = any,
  Key extends keyof T = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponentProps {
  readonly shape: TypeConstructor<T>;
  readonly key: Key;
  readonly events: Events;
  readonly reducer: (state: T, event: InstanceType<Events[number]>) => T;
  readonly initalState: T;
}

export class Aggregate<
  T extends object = any,
  Key extends keyof T = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponent {
  readonly kind: "Aggregate" = "Aggregate";
  readonly shape: Struct<T>;
  readonly key: Key;
  readonly reducer: (state: T, event: InstanceType<Events[number]>) => T;
  readonly initialState: T;
  constructor(props: AggregateProps<T, Key, Events>) {
    super(props);
    this.reducer = props.reducer;
    this.initialState = props.initalState;
  }
}

export namespace Aggregate {
  export type Clients<A extends readonly Aggregate[] | undefined> = A extends undefined
    ? []
    : {
        [i in keyof A]: A[i] extends Aggregate ? Client<A[i]> : A[i];
      };

  /**
   * Client for an Aggregate is Aggregate.Client
   */
  export type Client<A> = A extends Aggregate
    ? {
        get: (key: A["shape"]["TYPE"][A["key"]]) => Promise<A["shape"]["TYPE"] | undefined>;
      }
    : never;

  export function client<A extends Aggregate>(): Client<A> {
    throw new Error("todo");
  }
}
