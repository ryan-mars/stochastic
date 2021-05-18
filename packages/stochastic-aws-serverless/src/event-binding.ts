import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { ITopicSubscription, SubscriptionFilter } from '@aws-cdk/aws-sns';
import { SqsSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { Queue } from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import { join } from 'path';
import { DomainEvent } from 'stochastic';


export interface EmitEventBinding<E extends DomainEvent = DomainEvent> {
  readonly events: E[];
  bind(scope: cdk.Construct): ITopicSubscription
}

export interface RecieveEventBinding<E extends DomainEvent = DomainEvent> {
  readonly events: E[];
  bind(scope: cdk.Construct): ITopicSubscription
}

export class ReceiveEventBridgeEventBinding<E extends DomainEvent = DomainEvent> implements RecieveEventBinding<E> {
  readonly events: E[];
  readonly eventBridgeArn: string;
  constructor(props: {
    events: E[],
    eventBridgeArn: string
  }) {
    this.events = props.events;
    this.eventBridgeArn = props.eventBridgeArn;
  }

  public bind(scope: cdk.Construct): ITopicSubscription {
    throw new Error("Method not implemented.");
  }
}

// TODO: Not sure why this isn't just a normal construct 
export class EmitEventBridgeBinding<E extends DomainEvent = DomainEvent> implements EmitEventBinding<E> {
  readonly events: E[];
  readonly account: string;
  constructor(props: {
    events: E[],
    account: string
  }) {
    this.events = props.events;
    this.account = props.account;
  }

  public bind(scope: cdk.Construct): ITopicSubscription {
    const emittedEventsQueue = new Queue(scope, `EmittedEventsQueue`);
    const publicEventsForwarder = new NodejsFunction(scope, "PublicEventForwarder", {
      entry: join(__dirname, "event-bridge-forwarder.js")
    })
    publicEventsForwarder.addEventSource(new SqsEventSource(emittedEventsQueue));
    return new SqsSubscription(emittedEventsQueue, {
      rawMessageDelivery: true,
      filterPolicy: {
        event_type: SubscriptionFilter.stringFilter({
          whitelist: this.events.map(e => e.__typename),
        }),
      },
    })
  }
}
