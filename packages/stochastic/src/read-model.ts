import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";

import { Struct } from "superstruct";

export interface ReadModelProps<Model = any, E extends DomainEvent[] = DomainEvent[]> extends BaseComponentProps {
  shape: Struct<Model>;
  events: E;
}

export class ReadModel<Model = any, Events extends DomainEvent[] = DomainEvent[]> extends BaseComponent {
  readonly kind: "ReadModel" = "ReadModel";
  readonly shape: Struct<Model>;
  readonly events: Events;

  constructor(props: ReadModelProps<Model, Events>, readonly reduce: ReadModel.Reducer<Model, Events>) {
    super(props);
    this.shape = props.shape;
    this.events = props.events;
  }
}

export namespace ReadModel {
  export type Reducer<Model = any, Events extends DomainEvent[] = DomainEvent[]> = (
    events: InstanceType<Events[number]>[],
    model: Model,
  ) => Model;

  export type Runtime<C extends ReadModel[]> = {
    [i in keyof C]: C[i] extends ReadModel<infer Model> ? () => Promise<Model> : C[i];
  };
}

export interface ByKeyReadModelProps<
  E extends DomainEvent[] = DomainEvent[],
  Model extends object = object,
  Key extends keyof Model = keyof Model
> extends BaseComponentProps {
  events: E;
  shape: Struct<Model>;
  key: Key;
}

export class ByKeyReadModel<
  Events extends DomainEvent[] = DomainEvent[],
  Model extends object = object,
  Key extends keyof Model = keyof Model
> extends ReadModel<Model, Events> {
  constructor(props: ByKeyReadModelProps<Events, Model, Key>, reduce: (events: InstanceType<Events[number]>[], model: Model) => Model) {
    super(props, reduce);
    // TODO: implement
  }
}
