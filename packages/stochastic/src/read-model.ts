import { Config, ConfigRuntime } from "./config"
import { DomainEvent, DomainEventEnvelope } from "./event"
import { BaseEventHandler, EventHandlerProps } from "./event-handler"
import { Shape } from "./shape"

export interface ReadModelProps<E extends DomainEvent[], D extends Config[], Interface = any>
  extends EventHandlerProps<E, D> {
  projection: (
    dependencies: ConfigRuntime<D>,
    context: any
  ) => (event: DomainEventEnvelope<Shape.Value<E[number]>>, context: any) => Promise<void>
  /**
   * Initialie a client interface to this read model's state.
   */
  client: (dependencies: ConfigRuntime<D>, context: any) => Interface
}

export class ReadModel<
  E extends DomainEvent[] = DomainEvent[],
  D extends Config[] = Config[],
  Interface = any
> extends BaseEventHandler<E, D> {
  readonly kind: "ReadModel" = "ReadModel"

  readonly client: (config: ConfigRuntime<D>, context: any) => Interface

  constructor(
    props: ReadModelProps<E, D, Interface>
    /**
     * Projection function consumes events and aggregates data into a database optimized for this read model's purpose.
     */
  ) {
    super(props, props.projection)
    this.client = props.client
  }
}

export type ReadModelInterface<R extends ReadModel> = ReturnType<R["client"]>
