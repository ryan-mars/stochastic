import { Component } from "./component";

export interface BoundedContextComponents {
  readonly [name: string]: Component;
}

// we want this to be callable
export class BoundedContext<Name extends string = string, Components extends BoundedContextComponents = BoundedContextComponents> {
  readonly handler: string;
  readonly name: Name;

  readonly components: Components;
  readonly componentNames: Map<Component, string> = new Map();

  constructor(props: { handler: string; name: Name; components: Components }) {
    this.handler = props.handler;
    this.name = props.name;
    this.components = props.components;
    Object.entries(this.components).forEach(([name, component]) => this.componentNames.set(component, name));
  }
}
