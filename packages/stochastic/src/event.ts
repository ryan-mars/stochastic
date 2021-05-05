import {
  assign,
  date,
  defaulted,
  define,
  literal,
  object,
  string,
  Struct,
} from "superstruct";
import KSUIDlib from "ksuid";
import validate from "vali-date";

export class Event<Name extends string = string, E = any> {
  readonly kind: "Event" = "Event";
  constructor(readonly name: Name, readonly shape: Struct<E>) {}
}

export const ksuid = define<string>("KSUID", (value: string) =>
  KSUIDlib.isValid(Buffer.from(value, "utf-8")));

// export const isoDate = define<string>("isoDate", (value: string) =>
//   validate(value));

export function event<T>(name: string, payload: Struct<T>) {
  return assign(
    object({ type: literal(name), payload }),
    object({
      //id: defaulted(ksuid, () => KSUIDlib.randomSync()),
      id: string(),
      time: string(),
    })
  );
}
