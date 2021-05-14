import { Aggregate } from "./aggregate";

export class Dependencies<A extends readonly Aggregate[] = readonly Aggregate[]> {
  readonly kind: "Dependencies" = "Dependencies";
  readonly deps: A;
  constructor(...deps: A) {
    this.deps = deps;
  }
}
// export type DependenciesInterface<D extends readonly Aggregate[] | undefined> = {
//   [i in keyof D]: D[i] extends Aggregate ? AggregateInterface<D[i]> : never;
// };
