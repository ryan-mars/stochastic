import { Dependency, DependencyRuntime } from "./dependencies"
import { DomainEvent } from "./event"
import { BaseEventHandler, EventHandlerProps } from "./event-handler"
import { Shape } from "./shape"

export interface ReadModelProps<E extends DomainEvent[], D extends Dependency[]> extends EventHandlerProps<E, D> {}

export class ReadModel<
  E extends DomainEvent[] = DomainEvent[],
  D extends Dependency[] = Dependency[],
  Interface extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<any>
> extends BaseEventHandler<E, D> {
  readonly kind: "ReadModel" = "ReadModel"

  constructor(
    props: EventHandlerProps<E, D>,
    readonly projection: (
      dependencies: DependencyRuntime<D>,
      context: any
    ) => (event: Shape.Value<E[number]>) => Promise<void>,
    readonly client: (dependencies: DependencyRuntime<D>, context: any) => Interface
  ) {
    super(props, projection)
  }
}

export type ReadModelInterface<M extends ReadModel> = M extends ReadModel<any, any, infer I> ? I : never
