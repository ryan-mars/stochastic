import KSUID from "ksuid";
import { ObjectSchema } from "superstruct/lib/utils";
import { NewShape, Shape } from "./shape";

export interface DomainEventEnvelopeProps<Payload> {
  source: string;
  source_id: string;
  id?: string;
  time?: Date;
  payload: Payload;
}

export class DomainEventEnvelope<Payload extends { __typename: string }> {
  readonly type: Payload["__typename"];
  readonly id: string;
  readonly time: Date;
  readonly source: string;
  readonly source_id: string;
  readonly payload: Payload;

  constructor(props: DomainEventEnvelopeProps<Payload>) {
    this.type = props.payload.__typename;
    this.id = props.id ?? KSUID.randomSync().string;
    this.time = props.time ?? new Date();
    this.payload = props.payload;
    this.source = props.source;
    this.source_id = props.source_id;
  }
}

export function DomainEvent<__typename extends string, S extends ObjectSchema>(
  __typename: __typename,
  schema: S,
): DomainEvent<__typename, S> {
  const shape = Shape(__typename, schema);
  (shape as any).kind === "DomainEvent";
  return shape as any;
}

export type DomainEvent<__typename extends string = string, S extends ObjectSchema = ObjectSchema> = NewShape<__typename, S> & {
  kind: "DomainEvent";
};
