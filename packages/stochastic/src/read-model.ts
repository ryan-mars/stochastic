import { BaseComponent, BaseComponentProps } from "./component"
import { Dependency, DependencyRuntime } from "./dependencies"
import { DomainEvent } from "./event"
import { BaseEventHandler, EventHandler } from "./event-handler"

// export interface ReadModelProps<E extends DomainEvent[], D extends Dependency[]> extends BaseComponentProps {
//   readonly events: E
//   readonly dependencies: D
// }

export class ReadModel<
  E extends DomainEvent[] = DomainEvent[],
  D extends Dependency[] = Dependency[]
> extends BaseEventHandler<E, D> {
  readonly kind: "ReadModel" = "ReadModel"
}
