import { Command, CommandInterface } from "./command";
import { BaseComponent, BaseComponentProps } from "./component";
import { DomainEvent } from "./event";
import { Shape } from "./shape";

export interface PolicyProps<E extends readonly DomainEvent[] = readonly DomainEvent[], C extends readonly Command[] = readonly Command[]>
  extends BaseComponentProps {
  readonly events: E;
  readonly commands: C;
}

export class Policy<
  Name extends string = string,
  Events extends readonly DomainEvent[] = readonly DomainEvent[],
  Commands extends readonly Command[] = readonly Command[]
> extends BaseComponent {
  readonly kind: "Policy" = "Policy";
  public readonly events: Events;
  public readonly commands: Commands;

  constructor(props: PolicyProps<Events, Commands>, readonly apply: Policy.Handler<Events, Commands>) {
    super(props);
    this.events = props.events;
    this.commands = props.commands;
  }
}

export namespace Policy {
  export type Handler<E extends readonly DomainEvent[], C extends readonly Command[]> = (
    event: Shape.Value<E[number]>,
    ...commands: CommandInterface<C>
  ) => Promise<void>;
}
