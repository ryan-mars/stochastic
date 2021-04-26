import { Struct } from "superstruct";

export class Event<Name extends string = string, E = any> {
  readonly kind: "Event" = "Event";
  constructor(readonly name: Name, readonly shape: Struct<E>) {}
}

