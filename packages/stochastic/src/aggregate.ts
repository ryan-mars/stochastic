import { Struct } from "superstruct";
import { BaseComponent, BaseComponentProps } from "./component";

export interface AggregateProps<
  T extends object = any,
  Key extends keyof T = any
> extends BaseComponentProps {
  readonly shape: Struct<T>;
  readonly key: Key;
  readonly reducer: (state: T, event: any) => T;
  readonly initalState: T;
}

export class Aggregate<
  T extends object = any,
  Key extends keyof T = any
> extends BaseComponent {
  readonly kind: "Aggregate" = "Aggregate";
  readonly shape: Struct<T>;
  readonly key: Key;
  constructor(props: AggregateProps<T, Key>) {
    super(props);
  }
}

export namespace Aggregate {
  export type Clients<
    A extends readonly Aggregate[] | undefined
  > = A extends undefined
    ? []
    : {
        [i in keyof A]: A[i] extends Aggregate ? Client<A[i]> : A[i];
      };

  /**
   * Client for an Aggregate is Aggregate.Client
   */
  export type Client<A> = A extends Aggregate
    ? {
        get: (key: A["shape"]["TYPE"][A["key"]]) => Promise<A["shape"]["TYPE"]>;
      }
    : never;

  export function client<A extends Aggregate>(): Client<A> {
    throw new Error("todo");
  }
}
