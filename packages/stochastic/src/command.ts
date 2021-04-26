import { Struct } from "superstruct";
import { Aggregate } from "./aggregate";
import { BaseComponent, BaseComponentProps } from "./component";
import { Event } from "./event";

export interface CommandProps<
  Agg extends Aggregate = Aggregate,
  Request = any,
  Events extends readonly Event[] = readonly Event[]
> extends BaseComponentProps {
  readonly request: Struct<Request>;
  readonly aggregate: Agg;
  readonly events: Events;
}

export class Command<
  Name extends string = string,
  Agg extends Aggregate = Aggregate,
  Request = any,
  Events extends readonly Event[] = readonly Event[]
> extends BaseComponent {
  readonly kind: "Command" = "Command";
  readonly request: Struct<Request>;
  readonly aggregate: Agg;
  readonly events: Events;
  constructor(
    props: CommandProps<Agg, Request, Events>,
    readonly execute: Command.Handler<Request, Agg, Events>
  ) {
    super(props);
    this.request = props.request;
    this.aggregate = props.aggregate;
    this.events = props.events;
  }
}

export namespace Command {
  export type Handler<
    Request,
    Agg extends Aggregate,
    Events extends readonly Event[]
  > = (
    request: Request,
    aggregate: Aggregate.Client<Agg>
  ) => Promise<Events[number]["shape"]["TYPE"][]>;

  export type Runtime<C extends readonly Command[]> = {
    [i in keyof C]: C[i] extends Command ? (
      input: C[i]["request"]["TYPE"]
    ) => Promise<C[i]["events"][number]["shape"]["TYPE"]> : C[i];
  };
}
