import { IEventBus, Rule } from "@aws-cdk/aws-events"
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources"
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs"
import { ITopic, ITopicSubscription, SubscriptionFilter } from "@aws-cdk/aws-sns"
import { SqsSubscription } from "@aws-cdk/aws-sns-subscriptions"
import { Queue } from "@aws-cdk/aws-sqs"
import * as cdk from "@aws-cdk/core"
import { join } from "path"
import { BoundedContext, DomainEvent } from "stochastic"
import { SqsQueue } from "@aws-cdk/aws-events-targets"

export interface EmitEventBinding<E extends DomainEvent = DomainEvent> {
  readonly events: E[]
  bind(scope: cdk.Construct, boundedContextName: string): ITopicSubscription
}

export interface RecieveEventBinding<E extends DomainEvent = DomainEvent> {
  readonly events: E[]
  readonly otherBoundedContext: BoundedContext
  bind(scope: cdk.Construct, topic: ITopic): void
}

export class ReceiveEventBridgeEventBinding<E extends DomainEvent = DomainEvent> implements RecieveEventBinding<E> {
  readonly events: E[]
  readonly eventBus: IEventBus
  readonly otherBoundedContext: BoundedContext
  constructor(props: { otherBoundedContext: BoundedContext; events: E[]; readonly eventBus: IEventBus }) {
    this.otherBoundedContext = props.otherBoundedContext
    this.events = props.events
    this.eventBus = props.eventBus
  }

  public bind(scope: cdk.Construct, topic: ITopic) {
    const receivedEventsQueue = new Queue(scope, `${this.otherBoundedContext.name}ReceivedEventsQueue`)
    const publicEventsReceiver = new NodejsFunction(scope, `${this.otherBoundedContext.name}PublicEventsReceiver`, {
      entry: join(__dirname, "event-bridge-receiver.js"),
      environment: {
        EVENT_STREAM_TOPIC_ARN: topic.topicArn,
      },
    })
    topic.grantPublish(publicEventsReceiver)
    publicEventsReceiver.addEventSource(new SqsEventSource(receivedEventsQueue))

    new Rule(scope, `${this.otherBoundedContext.name}EventBridgeRule`, {
      targets: [new SqsQueue(receivedEventsQueue)],
      eventPattern: {
        source: [this.otherBoundedContext.name],
        detailType: this.events.map(e => e.__typename),
      },
      eventBus: this.eventBus,
    })
  }
}

// TODO: Not sure why this isn't just a normal construct
export class EmitEventBridgeBinding<E extends DomainEvent = DomainEvent> implements EmitEventBinding<E> {
  readonly events: E[]
  readonly account?: string
  readonly eventBus: IEventBus
  constructor(props: { events: E[]; account?: string; eventBus: IEventBus }) {
    this.events = props.events
    this.account = props.account
    this.eventBus = props.eventBus
  }

  public bind(scope: cdk.Construct, boundedContextName: string): ITopicSubscription {
    const emittedEventsQueue = new Queue(scope, `EmittedEventsQueue`)
    const publicEventsForwarder = new NodejsFunction(scope, "PublicEventForwarder", {
      entry: join(__dirname, "event-bridge-forwarder.js"),
      environment: {
        EVENT_BUS_ARN: this.eventBus.eventBusArn,
        BOUNDED_CONTEXT_NAME: boundedContextName,
      },
    })
    this.eventBus.grantPutEventsTo(publicEventsForwarder)
    publicEventsForwarder.addEventSource(new SqsEventSource(emittedEventsQueue))
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
