import { Aggregate, BoundedContext } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { ComponentConstruct, ComponentConstructProps, ComponentProps } from "./component-construct"

export interface AggregateConstructProps<A extends Aggregate = Aggregate> {
  /**
   * DynamoDB Table to use.
   *
   * @default one will be created for you
   */
  //table?: dynamodb.Table;
}

/**
 * Construct for an Aggregate - it creates a DynamoDB Table for storing backing data.
 */
export class AggregateConstruct<
  S extends BoundedContext = BoundedContext,
  A extends Aggregate = Aggregate
> extends ComponentConstruct<S, A> {
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<A> & ComponentConstructProps<S, A>) {
    super(scope, id, props)
  }
}
