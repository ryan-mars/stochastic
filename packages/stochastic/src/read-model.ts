import { BaseComponent, BaseComponentProps } from "./component";
import { Event } from "./event";

import {Struct} from 'superstruct';

// I think we're overloading the ReadModel concept with a Query... which I left out
// A query handler should be a lambda

// we need to reduce Events to State, and then query State ?
// Why not just feed them the events and give them a client for their DB of choice and let the dev sort it out
// I don't know State is always going to be so clean unless you have a clever approach
// I would say State is more general, "doing what you want with a DB", is `State<void>` or `State<any>`?
// Ok go for it
// LOL i dunno
// Neither do I right now I'm using dynamodb-toolbox to create a Model for each read model and I update or query those models (just an abstraction over the document client)  but I don't want to recreate an ORM
// The other thing is, read models are going to be varied how to do you give the dev the freedom to implement using whatever abstraction they want?
// Override a `save` function?
// ok cool
// we only need this if we care about the type of state elsewhere. like in GraphQL...
// Let's go for it but do we want to call it state or Model? 👍
// what was wrong with ReadModel? It's a model that can be read? Should it have multiple interfaces, maybe?
// I think we're down a rabbit hole right now
// Let's roll back up to commands

export interface ReadModelProps<
  Model = any,
  E extends Event[] = Event[]
> extends BaseComponentProps {
  shape: Struct<Model>;
  events: E;
}

export class ReadModel<
  Model = any,
  Events extends Event[] = Event[]
> extends BaseComponent {
  readonly kind: "ReadModel" = "ReadModel";
  readonly shape: Struct<Model>;
  readonly events: Events;

  constructor(
    props: ReadModelProps<Model, Events>,
    readonly reduce: ReadModel.Reducer<Model, Events>
  ) {
    super(props);
    this.shape = props.shape;
    this.events = props.events;
  }
}

export namespace ReadModel {
  export type Reducer<Model = any, Events extends Event[] = Event[]> = (
    events: Events[number]['shape']['TYPE'][],
    model: Model
  ) => Model

  export type Runtime<C extends ReadModel[]> = {
    [i in keyof C]: C[i] extends ReadModel<infer Model> ? () => Promise<Model> : C[i];
  };
}

export interface ByKeyReadModelProps<
  E extends Event[] = Event[],
  Model extends object = object,
  Key extends keyof Model = keyof Model
> extends BaseComponentProps {
  events: E;
  shape: Struct<Model>;
  key: Key;
}

export class ByKeyReadModel<
  Events extends Event[] = Event[],
  Model extends object = object,
  Key extends keyof Model = keyof Model
> extends ReadModel<Model, Events> {
  constructor(
    props: ByKeyReadModelProps<Events, Model, Key>,
    reduce: (events: Events[number]['shape']['TYPE'][], model: Model) => Model
  ) {
    super(props, reduce);
    // TODO: implement
  }
}
