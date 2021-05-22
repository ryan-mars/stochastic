import { Command } from "./command"
import { Component } from "./component"
import { EventHandler } from "./event-handler"
import { Policy } from "./policy"
import { ReadModel } from "./read-model"

export interface BoundedContextProps<
  Name extends string,
  Components extends BoundedContextComponents,
  Emits extends CreatedEvents<Components>[]
> {
  name: Name
  components: Components
  handler: string
  emits?: Emits
}

export interface BoundedContextComponents {
  readonly [name: string]: Component
}

// we want this to be callable
export class BoundedContext<
  Name extends string = string,
  Components extends BoundedContextComponents = BoundedContextComponents,
  Emits extends CreatedEvents<Components>[] = any
> {
  readonly handler: string
  readonly name: Name

  readonly components: Components
  readonly componentNames: Map<Component, string> = new Map()
  readonly emits: Emits

  constructor(props: BoundedContextProps<Name, Components, Emits>) {
    this.handler = props.handler
    this.name = props.name
    this.components = props.components
    this.emits = (props.emits ?? []) as Emits
    Object.entries(this.components).forEach(([name, component]) => this.componentNames.set(component, name))
  }
}

export type CreatedEvents<Components extends BoundedContextComponents> = {
  [component in keyof Components]: Components[component] extends Command<any, any, infer E> ? E[number] : never
}[keyof Components]

export type ConsumedEvents<Components extends BoundedContextComponents> = {
  [component in keyof Components]: Components[component] extends
    | Command<any, any, infer E>
    | Policy<any, infer E>
    | EventHandler<infer E>
    | ReadModel<infer E>
    ? E[number]
    : never
}[keyof Components]

export type AllEvents<Components extends BoundedContextComponents> =
  | CreatedEvents<Components>
  | ConsumedEvents<Components>

export type BoundedContextDependencies<Components extends BoundedContextComponents> = {
  [component in keyof Components]: Components[component] extends ReadModel<any, infer D> | EventHandler<any, infer D>
    ? D[number]
    : never
}[keyof Components]
