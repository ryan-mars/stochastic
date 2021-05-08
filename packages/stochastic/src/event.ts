import { assign, literal, object, string, Struct } from "superstruct";

export class Event<Name extends string = string, E = any> {
  readonly kind: "Event" = "Event";
  constructor(readonly name: Name, readonly shape: Struct<E>) {}
}

export function event<T, Name extends string = string>(
  name: Name,
  payload: Struct<T>
) {
  return assign(
    object({ type: literal(name), payload }),
    object({
      id: string(),
      time: string(),
    })
  );
}
