import * as cdk from "@aws-cdk/core"

import { Aggregate, BoundedContext, Command, Component, EventHandler, Policy, ReadModel } from "stochastic"
import { AggregateConstructProps } from "./aggregate-construct"
import { CommandConstructProps } from "./command-construct"
import { EventHandlerConstructProps } from "./event-handler-construct"
import { PolicyConstructProps } from "./policy-construct"

/**
 * Computes the properties for a component's corresponding CDK Construct.
 */
export type ComponentProps<C extends Component> = C extends Aggregate
  ? AggregateConstructProps<C>
  : C extends Command
  ? CommandConstructProps<C>
  : C extends Policy
  ? PolicyConstructProps<C>
  : C extends ReadModel | EventHandler
  ? EventHandlerConstructProps<C>
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
