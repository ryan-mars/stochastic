import * as cdk from "@aws-cdk/core"

import { Store, BoundedContext, Command, Component, EventHandler, Policy, Query, ReadModel } from "stochastic"
import { StoreConstructProps } from "./store-construct"
import { CommandConstructProps } from "./command-construct"
import { EventHandlerConstructProps } from "./event-handler-construct"
import { PolicyConstructProps } from "./policy-construct"
import { QueryConstructProps } from "./query-construct"

/**
 * Computes the properties for a component's corresponding CDK Construct.
 */
export type ComponentProps<C extends Component> = C extends Store
  ? StoreConstructProps<C>
  : C extends Command
  ? CommandConstructProps<C>
  : C extends Policy
  ? PolicyConstructProps<C>
  : C extends ReadModel | EventHandler
  ? EventHandlerConstructProps<C>
  : C extends Query
  ? QueryConstructProps<C>
  : never

export interface ComponentConstructProps<S extends BoundedContext = BoundedContext, C extends Component = Component> {
  boundedContext: S
  component: C
  name: string
}

export class ComponentConstruct<
  S extends BoundedContext = BoundedContext,
  C extends Component = Component
> extends cdk.Construct {
  readonly boundedContext: S
  readonly component: C
  readonly name: string
  constructor(scope: cdk.Construct, id: string, props: ComponentConstructProps<S, C>) {
    super(scope, id)
    this.boundedContext = props.boundedContext
    this.component = props.component
    this.name = props.name
  }
}
