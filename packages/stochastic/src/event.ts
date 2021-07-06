import KSUID from "ksuid"
import { NewShape, ObjectSchema, Shape } from "./shape"

export interface DomainEventEnvelopeProps<Payload> {
  source: string
  source_id: string
  id?: string
  time?: Date
  payload: Payload
}

// TODO: Shouldn't Payload be narrowed to `extends DomainEvent`?
export class DomainEventEnvelope<Payload extends { __typename: string } = { __typename: string }> {
  readonly type: Payload["__typename"]
  readonly id: string
  readonly time: Date
  readonly source: string
  readonly source_id: string
  readonly payload: Payload

  constructor(props: DomainEventEnvelopeProps<Payload>) {
    this.type = props.payload.__typename
    this.id = props.id ?? KSUID.randomSync().string
    this.time = props.time ?? new Date()
    this.payload = props.payload
    this.source = props.source
    this.source_id = props.source_id
  }
}

export type DomainEvent<__typename extends string = string, S = any, Key extends string = string> = Shape<
  __typename,
  S
> & {
  kind: "DomainEvent"
  __key: Key
}

export function DomainEvent<__typename extends string, Key extends keyof S, S extends ObjectSchema>(
  __typename: __typename,
  __key: Key,
  schema: S,
): NewShape<__typename, S> & {
  kind: "DomainEvent"
  __key: Key
} {
  const shape = Shape(__typename, schema)
  ;(shape as any).kind = "DomainEvent"
  if (typeof __key !== "string") {
    throw new Error("DomainEvent.__key must be a string")
  }
  if (typeof __typename !== "string") {
    throw new Error("DomainEvent.__typename must be a string")
  }
  ;(shape as any).__typename = __typename
  ;(shape as any).__key = __key
  return shape as any
}
