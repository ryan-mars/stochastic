import * as cdk from "@aws-cdk/core"
import {
  Store,
  BoundedContext,
  BoundedContextConfig,
  CreatedEvents,
  Command,
  Component,
  Policy,
  ConsumedEvents,
  ReadModel,
  EventHandler,
  Query,
  Shape
} from "stochastic"
import { EmitEventBinding, RecieveEventBinding } from "./event-binding"
import { ConfigBinding } from "./config-binding"
import { EventStore } from "./event-store-construct"
import { StoreConstruct } from "./store-construct"
import { CommandConstruct } from "./command-construct"
import { ComponentProps } from "./component-construct"
import { PolicyConstruct } from "./policy-construct"
import { EventHandlerConstruct } from "./event-handler-construct"
import { QueryConstruct } from "./query-construct"

/**
 * Map each component in the Bounded Context to its corresponding CDK Construct.
 */
type CDKComponents<S extends BoundedContext> = {
  [id in keyof S["components"]]: CDKComponent<S, S["components"][id]>
}

/**
 * May a Component, `C`, to its corresponding CDK Construct representation.
 */
type CDKComponent<S extends BoundedContext, C extends Component> = C extends Store
  ? StoreConstruct<S, C>
  : C extends Command
  ? CommandConstruct<S, C>
  : cdk.Construct

export interface IBoundedContextConstruct /* extends cdk.IConstruct */ {
  readonly eventBridgeArn: string
}

export class BoundedContextConstruct<Context extends BoundedContext = BoundedContext>
  extends cdk.Construct
  implements IBoundedContextConstruct
{
  public static fromArn(eventBridgeArn: string): IBoundedContextConstruct {
    // TODO: base construct for BoundedContext, following pattern of CDK
    // https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-lambda/lib/function.ts#L403
    return {
      eventBridgeArn
    }
  }

  public readonly boundedContext: Context
  /**
   * The Constructs for each of the Bounded Context Components.
   */
  public readonly components: CDKComponents<Context> = {} as CDKComponents<Context>

  /**
   * Associate the Component reference with the corresponding Construct.
   */
  public readonly componentMap: Map<Component, cdk.Construct> = new Map()
  /**
   * Where events are stored (for now)
   */
  public readonly eventStore: EventStore

  public readonly eventBridgeArn: string

  public readonly emitScope: cdk.Construct
  public readonly emitEvents: EmitEventBinding<CreatedEvents<Context["components"]>>[]

  public readonly receiveScope: cdk.Construct
  public readonly receiveEvents: RecieveEventBinding<Context["emits"][number]>[]

  readonly config: {
    [configName in BoundedContextConfig<Context["components"]>["name"]]: ConfigBinding
  }

  constructor(
    scope: cdk.Construct,
    id: string,
    props: {
      boundedContext: Context
      components?: {
        [name in keyof Context["components"]]?: ComponentProps<Context["components"][name]>
      }
      emitEvents?: EmitEventBinding<Context["emits"][number]>[]
      receiveEvents?: RecieveEventBinding<ConsumedEvents<Context["components"]>>[]
      config: {
        [configName in BoundedContextConfig<Context["components"]>["name"]]: ConfigBinding<
          Shape.Value<BoundedContextConfig<Context["components"]>["shape"]>
        >
      }
    }
  ) {
    super(scope, id)
    this.config = props.config
    const boundedContext = (this.boundedContext = props.boundedContext)
    this.emitEvents = props.emitEvents ?? []
    this.receiveEvents = props.receiveEvents ?? []
    const eventStore = (this.eventStore = new EventStore(scope, { boundedContext }))
    this.eventBridgeArn = "???"

    this.emitScope = new cdk.Construct(this, "Emits")
    this.receiveScope = new cdk.Construct(this, "Receive")

    this.emitEvents.map(binding =>
      this.eventStore.topic.addSubscription(binding.bind(this.emitScope, this.boundedContext.name))
    )
    this.receiveEvents.map(binding => binding.bind(this.receiveScope, this.eventStore.topic))

    const commandConstructs = new Map<string, CommandConstruct>()

    for (const [componentName, component] of Object.entries(boundedContext.components).sort(
      ([nameA, componentA], [nameB, componentB]) => (componentA.kind === "Command" ? -1 : 1)
    )) {
      const componentProps = (props.components as any)?.[componentName] as ComponentProps<Component>
      let con: StoreConstruct | CommandConstruct | PolicyConstruct | EventHandlerConstruct | QueryConstruct | undefined

      if (component.kind === "Store") {
        con = new StoreConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<Store>),
          component,
          boundedContext,
          name: componentName
        })
      } else if (component.kind === "Command") {
        con = new CommandConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<Command>),
          component,
          boundedContext,
          name: componentName
        })
        commandConstructs.set(componentName, con)
        // } else if (component.kind === "Event") {
        // TODO
      } else if (component.kind === "Policy") {
        con = new PolicyConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<Policy>),
          component,
          boundedContext,
          name: componentName,
          commands: commandConstructs
        })
      } else if (component.kind === "EventHandler") {
        con = new EventHandlerConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<EventHandler>),
          component,
          boundedContext,
          name: componentName
        })
      } else if (component.kind === "ReadModel") {
        con = new EventHandlerConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<ReadModel>),
          component,
          boundedContext,
          name: componentName,
          dependencies: props.config
        })
      } else if (component.kind === "Query") {
        con = new QueryConstruct(this as any, componentName, {
          ...(componentProps as ComponentProps<Query>),
          component,
          boundedContext,
          name: componentName,
          dependencies: props.config
        })
      }
      if (con) {
        ;(this.components as any)[componentName] = con
        this.componentMap.set(component, con)
      }
    }
  }

  public receiveEvent(binding: RecieveEventBinding<CreatedEvents<Context["components"]>>): void {
    binding.bind(this.receiveScope, this.eventStore.topic)
  }

  public emitEvent(binding: EmitEventBinding<Context["emits"][number]>): void {
    binding.bind(this.emitScope, this.boundedContext.name)
  }
}
