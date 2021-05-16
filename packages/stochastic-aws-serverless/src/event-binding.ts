import { DomainEvent } from "stochastic";


export interface EventBinding<E extends DomainEvent = DomainEvent> {
  readonly events: E[];
  bind(): void;
}

export class ReceiveEventBridgeEventBinding<E extends DomainEvent = DomainEvent> implements EventBinding<E> {
  readonly events: E[];
  readonly eventBridgeArn: string;
  constructor(props: {
    events: E[],
    eventBridgeArn: string
  }) {
    this.events = props.events;
    this.eventBridgeArn = props.eventBridgeArn;
  }

  public bind(): void {
    throw new Error("Method not implemented.");
  }
}


export class EmitEventBridgeBinding<E extends DomainEvent = DomainEvent> implements EventBinding<E> {
  readonly events: E[];
  readonly account: string;
  constructor(props: {
    events: E[],
    account: string
  }) {
    this.events = props.events;
    this.account = props.account;
  }

  public bind(): void {
    throw new Error("Method not implemented.");
  }
}
