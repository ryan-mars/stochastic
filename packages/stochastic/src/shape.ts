import { create, object } from "superstruct";
import { ObjectSchema } from "superstruct/lib/utils";

export type NewShape<__typename extends string, S extends ObjectSchema> = {
  __typename: __typename;
  fields: S;
} & (new (
  fields: {
    [field in keyof S]: S[field]["TYPE"];
  },
) => {
  __typename: __typename;
} & {
  [field in keyof S]: S[field]["TYPE"];
});

export function Shape<__typename extends string, S extends ObjectSchema>(__typename: __typename, schema: S): NewShape<__typename, S> {
  const Class = object(schema);
  return class {
    static readonly Class = Class;
    readonly __typename: __typename;

    constructor(
      fields: {
        [field in keyof S]: S[field]["TYPE"];
      },
    ) {
      for (const [name, value] of Object.entries(fields)) {
        (this as any)[name] = value;
      }
      this.__typename = __typename;
    }
  } as any;
}

export type Shape<__typename extends string = string, T = any> = {
  __typename: __typename;
  fields: ObjectSchema;
} & (new (...args: any[]) => T);

export namespace Shape {
  export type Value<S extends Shape> = InstanceType<S>;
}
