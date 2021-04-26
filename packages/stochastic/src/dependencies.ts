import { Aggregate } from "./aggregate";

export class Dependencies<
  A extends readonly Aggregate[] = readonly Aggregate[]
> {
  readonly kind: "Dependencies" = "Dependencies";
  readonly deps: A;
  constructor(...deps: A) {
    this.deps = deps;
  }
}
export namespace Dependencies {
  export type Clients<D extends readonly Aggregate[] | undefined> = D extends readonly Aggregate[]
    ? {
      [i in keyof D]: Aggregate.Client<D[i]>;
    }
    : [];
}