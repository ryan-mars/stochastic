import { assign, literal, object, string, Struct, create, optional, boolean, defaulted } from "superstruct";

import KSUID from "ksuid";

export interface DefaultMetadata {
  id?: string;
  time?: Date;
}

export type DomainEvent<
  __typename extends string = string,
  Fields extends {
    [fieldName in string]: Struct;
  } = any,
  Metadata extends {
    [fieldName in string]: Struct;
  } = {}
> = {
  // static space
  kind: "Event";
  name: __typename;
  payload: Fields;
} & (new (config: {
  payload: {
    [fieldName in keyof Fields]: Fields[fieldName]["TYPE"];
  };
  metadata?: DefaultMetadata &
    {
      [fieldName in keyof Metadata]: Exclude<Metadata, undefined>[fieldName]["TYPE"];
    };
}) => {
  // instance space
  __typename: __typename;
  id: string;
  time: Date;
  payload: {
    [fieldName in keyof Fields]: Fields[fieldName]["TYPE"];
  };
} & {
  [fieldName in keyof Metadata]: Metadata[fieldName]["TYPE"];
});

export function DomainEvent<
  __typename extends string,
  Fields extends {
    [fieldName in string]: Struct;
  },
  Metadata extends {
    [fieldName in string]: Struct;
  } = {}
>(
  __typename: __typename,
  config: {
    payload: Fields;
    metadata?: Metadata;
  },
): DomainEvent<__typename, Fields, Metadata> {
  const shape = object(config.payload);
  return class {
    static readonly shape = shape;

    readonly __typename = __typename;
    readonly id: string;
    readonly time: Date;

    payload: {
      [fieldName in keyof Fields]: Fields[fieldName]["TYPE"];
    };

    constructor(value: {
      payload: {
        [fieldName in keyof Fields]: Fields[fieldName]["TYPE"];
      };
      metadata?: DefaultMetadata &
        {
          [fieldName in keyof Metadata]: Exclude<Metadata, undefined>[fieldName]["TYPE"];
        };
    }) {
      this.id = value.metadata?.id ?? KSUID.randomSync().string;
      this.time = value.metadata?.time ?? new Date();

      this.payload = create(value.payload, shape) as any;
    }
  } as any;
}

export class FlightLanded extends DomainEvent("FlightLanded", {
  payload: {
    flightNo: string(),
    crashed: defaulted(boolean(), false),
  },
  metadata: {
    balls: optional(string()),
  },
}) {}
