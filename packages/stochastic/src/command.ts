import { Aggregate, AggregateInterface } from "./aggregate";
import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";
import { Shape } from "./shape";

export interface CommandProps<
  Agg extends Aggregate = Aggregate,
  Intent extends Shape = Shape,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponentProps {
  readonly intent: Intent;
  readonly aggregate: Agg;
  readonly events: Events;
}

export class Command<
  Agg extends Aggregate = Aggregate,
  Intent extends Shape = Shape,
  Events extends readonly DomainEvent[] = readonly DomainEvent[]
> extends BaseComponent {
  readonly kind: "Command" = "Command";
  readonly intent: Intent;
  readonly aggregate: Agg;
  readonly events: Events;
  constructor(props: CommandProps<Agg, Intent, Events>, readonly execute: CommandHandler<Shape.Value<Intent>, Agg, Events>) {
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

export type CommandHandler<Intent, Agg extends Aggregate, Events extends readonly DomainEvent[]> = (
  intent: Intent,
  aggregate: AggregateInterface<Agg>,
) => Promise<CommandResponse<any, Shape.Value<Events[number]>[]>>;

/**
 * The interface to a Command from a Policy
 */
export type CommandInterface<C extends readonly Command[]> = {
  [i in keyof C]: C[i] extends Command ? (intent: Shape.Value<C[i]["intent"]>) => any : C[i];
};
