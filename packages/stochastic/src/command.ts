import { Aggregate } from "./aggregate";
import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";
import { TypeConstructor } from "./type";

export interface CommandProps<
  Agg extends Aggregate = Aggregate,
  Request = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponentProps {
  readonly intent: TypeConstructor<Request>;
  readonly aggregate: Agg;
  readonly events: Events;
}

export class Command<
  Name extends string = string,
  Agg extends Aggregate = Aggregate,
  Request = any,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponent {
  readonly kind: "Command" = "Command";
  readonly intent: TypeConstructor<Request>;
  readonly aggregate: Agg;
  readonly events: Events;
  constructor(props: CommandProps<Agg, Request, Events>, readonly execute: Command.Handler<Request, Agg, Events>) {
    super(props);
    this.intent = props.intent;
    this.aggregate = props.aggregate;
    this.events = props.events;
  }
}

export type CommandResponse<T, Events> =
  | {
      events: Events;
      response?: T;
    }
  | Events;

export namespace Command {
  export type Handler<Request, Agg extends Aggregate, Events extends readonly DomainEvent[]> = (
    request: Request,
    aggregate: Aggregate.Client<Agg>,
  ) => Promise<CommandResponse<any, InstanceType<Events[number]>[]>>;

  /**
   * The interface to a Command from a Policy
   */
  export type Runtime<C extends readonly Command[]> = {
    [i in keyof C]: C[i] extends Command ? (input: InstanceType<C[i]["intent"]>) => any : C[i];
  };
}
