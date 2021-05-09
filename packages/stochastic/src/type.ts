import { create, object } from "superstruct";
import { ObjectSchema } from "superstruct/lib/utils";

export function Type<S extends ObjectSchema>(
  schema: S,
): new (
  fields: {
    [field in keyof S]: S[field]["TYPE"];
  },
) => {
  [field in keyof S]: S[field]["TYPE"];
} {
  const Class = object(schema);
  return class {
    static readonly Class = Class;

    constructor(
      fields: {
        [field in keyof S]: S[field]["TYPE"];
      },
    ) {
      for (const [name, value] of Object.entries(create(fields, Class))) {
        (this as any)[name] = value;
      }
    }
  } as any;
}

export type TypeConstructor<T> = new (...args: any[]) => T;
