import * as cdk from "@aws-cdk/core"

import { Store, BoundedContext, Command, Component, EventHandler, Policy, Query, ReadModel } from "stochastic"
import { StoreConstruct, StoreConstructProps } from "./store-construct"
import { CommandConstruct, CommandConstructProps } from "./command-construct"
import { EventHandlerConstruct, EventHandlerConstructProps } from "./event-handler-construct"
import { PolicyConstruct, PolicyConstructProps } from "./policy-construct"
import { QueryConstruct, QueryConstructProps } from "./query-construct"

/**
 * Computes the properties for a component's corresponding CDK Construct.
 */
export type ComponentProps<B extends BoundedContext, C extends Component> = C extends Store
  ? StoreConstructProps<B, C>
  : C extends Command
  ? CommandConstructProps<B, C>
  : C extends Policy
  ? PolicyConstructProps<B, C>
  : C extends ReadModel | EventHandler
  ? EventHandlerConstructProps<C>
  : C extends Query
  ? QueryConstructProps<C>
  : never

export type ComponentConstructs<B extends BoundedContext = BoundedContext> =
  | CommandConstruct<B>
  | PolicyConstruct<B>
  | QueryConstruct<B>
  | EventHandlerConstruct<B>
  | StoreConstruct<B>

export interface ComponentConstructProps<B extends BoundedContext = BoundedContext, C extends Component = Component> {
  boundedContext: B
  component: C
  name: string
}

export class ComponentConstruct<
  B extends BoundedContext = BoundedContext,
  C extends Component = Component,
> extends cdk.Construct {
  readonly kind: C["kind"]
  readonly boundedContext: B
  readonly component: C
  readonly name: string

  constructor(scope: cdk.Construct, id: string, props: ComponentConstructProps<B, C>) {
    super(scope, id)
    this.component = props.component
    this.kind = this.component.kind
    this.boundedContext = props.boundedContext
    this.name = props.name
  }
}
