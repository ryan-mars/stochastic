import { Store, BoundedContext } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { ComponentConstruct, ComponentConstructProps, ComponentProps } from "./component-construct"

export interface StoreConstructProps<S extends Store = Store> {}

/**
 * Construct for a Store. Currently does nothing
 */
export class StoreConstruct<
  B extends BoundedContext = BoundedContext,
  S extends Store = Store
> extends ComponentConstruct<B, S> {
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<S> & ComponentConstructProps<B, S>) {
    super(scope, id, props)
  }
}
