import { BaseComponent, BaseComponentProps } from "./component";

import { Shape } from "./shape";

export interface ReadModelProps<Model extends Shape = Shape, E extends Shape[] = Shape[]> extends BaseComponentProps {
  shape: Model;
  events: E;
}

export class ReadModel<Model extends Shape = Shape, Events extends Shape[] = Shape[]> extends BaseComponent {
  readonly kind: "ReadModel" = "ReadModel";
  readonly shape: Model;
  readonly events: Events;

  constructor(props: ReadModelProps<Model, Events>, readonly reduce: ReadModel.Reducer<Model, Events>) {
    super(props);
    this.shape = props.shape;
    this.events = props.events;
  }
}

export namespace ReadModel {
  export type Reducer<Model extends Shape = Shape, Events extends Shape[] = Shape[]> = (
    events: Shape.Value<Events[number]>[],
    model: Shape.Value<Model>,
  ) => Shape.Value<Model>;

  export type Runtime<C extends ReadModel[]> = {
    [i in keyof C]: C[i] extends ReadModel<infer Model> ? () => Promise<Shape.Value<Model>> : C[i];
  };
}

export interface ByKeyReadModelProps<
  E extends Shape[] = Shape[],
  Model extends Shape = Shape,
  Key extends keyof Shape.Value<Model> = keyof Shape.Value<Model>,
> extends BaseComponentProps {
  events: E;
  shape: Model;
  key: Key;
}

export class ByKeyReadModel<
  Events extends Shape[] = Shape[],
  Model extends Shape = Shape,
  Key extends keyof Shape.Value<Model> = keyof Shape.Value<Model>,
> extends ReadModel<Model, Events> {
  constructor(
    props: ByKeyReadModelProps<Events, Model, Key>,
    reduce: (events: Shape.Value<Events[number]>[], model: Shape.Value<Model>) => Shape.Value<Model>,
  ) {
    super(props, reduce);
    // TODO: implement
  }
}
