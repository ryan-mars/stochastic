import { Aggregate } from "./aggregate"

export class Dependency<Name extends string = string> {
  readonly kind: "Dependency"
  constructor(readonly name: Name) {}
}

export type DependencyRuntime<D extends readonly Dependency[]> = {
  [d in D[number]["name"]]: string
}

export class Dependencies<A extends readonly Aggregate[] = readonly Aggregate[]> {
  readonly kind: "Dependencies" = "Dependencies"
  readonly deps: A
  constructor(...deps: A) {
    this.deps = deps
  }
}
// export type DependenciesInterface<D extends readonly Aggregate[] | undefined> = {
//   [i in keyof D]: D[i] extends Aggregate ? AggregateInterface<D[i]> : never;
// };
