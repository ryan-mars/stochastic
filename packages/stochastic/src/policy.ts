import { Command } from "./command";
import { BaseComponent, BaseComponentProps } from "./component";
import { Event } from "./event";

export interface PolicyProps<
  E extends readonly Event[] = readonly Event[],
  C extends readonly Command[] = readonly Command[]
> extends BaseComponentProps {
  readonly events: E;
  readonly commands: C;
}

export class Policy<
  Name extends string = string,
  Events extends readonly Event[] = readonly Event[],
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
  export type Handler<E extends readonly Event[], C extends readonly Command[]> = (
    event: E[number]['shape']['TYPE'],
    ...commands: Command.Runtime<C>
  ) => Promise<void>
}
