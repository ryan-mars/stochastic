import { Component } from "./component";

export interface EventStormComponents {
  readonly [name: string]: Component;
}

// we want this to be callable
export class EventStorm<Name extends string = string, Components extends EventStormComponents = EventStormComponents> {
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
