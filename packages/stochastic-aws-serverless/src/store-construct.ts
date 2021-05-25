import { Store, BoundedContext } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { ComponentConstruct, ComponentConstructProps, ComponentProps } from "./component-construct"

export interface StoreConstructProps<S extends Store = Store> {
  /**
   * DynamoDB Table to use.
   *
   * @default one will be created for you
   */
  //table?: dynamodb.Table;
}

/**
 * Construct for a Store - it creates s DynamoDB Table for storing backing data.
 */
export class StoreConstruct<
  B extends BoundedContext = BoundedContext,
  S extends Store = Store
> extends ComponentConstruct<B, S> {
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<S> & ComponentConstructProps<B, S>) {
    super(scope, id, props)
  }
}
