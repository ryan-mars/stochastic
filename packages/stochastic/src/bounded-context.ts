import { Command } from "./command";
import { Component } from "./component";
import { Policy } from "./policy";

export interface BoundedContextProps<Name extends string, Components extends BoundedContextComponents, Emits extends BoundedContextEvents<Components>[]> {
  name: Name;
  components: Components;
  handler: string;
  emits?: Emits;
}

export interface BoundedContextComponents {
  readonly [name: string]: Component;
}

// we want this to be callable
export class BoundedContext<
  Name extends string = string,
  Components extends BoundedContextComponents = BoundedContextComponents,
  Emits extends BoundedContextEvents<Components>[] = any
  > {
  readonly handler: string;
  readonly name: Name;

  readonly components: Components;
  readonly componentNames: Map<Component, string> = new Map();
  readonly emits: Emits;

  constructor(props: BoundedContextProps<Name, Components, Emits>) {
    this.handler = props.handler;
    this.name = props.name;
    this.components = props.components;
    this.emits = (props.emits ?? []) as Emits;
    Object.entries(this.components).forEach(([name, component]) => this.componentNames.set(component, name));
  }
}

export type BoundedContextEvents<Components extends BoundedContextComponents> = {
  [component in keyof Components]: Components[component] extends Policy | Command ? Components[component]['events'][number] : never;
}[keyof Components];
