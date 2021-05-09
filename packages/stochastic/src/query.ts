import { BaseComponent, BaseComponentProps } from "./component";
import { Shape } from "./shape";
import { ReadModel } from "./read-model";

export interface QueryProps<Request extends Shape = Shape, Results extends Shape = Shape, Models extends ReadModel[] = ReadModel[]>
  extends BaseComponentProps {
  readonly request: Request;
  readonly results: Results;
  readonly models: Models;
}

export class Query<
  Request extends Shape = Shape,
  Results extends Shape = Shape,
  Models extends ReadModel[] = ReadModel[]
> extends BaseComponent {
  readonly kind: "Query" = "Query";
  readonly request: Request;
  readonly results: Results;
  readonly models: Models;
  constructor(props: QueryProps<Request, Results, Models>, readonly query: Query.Handler<Request, Results, Models>) {
    super(props);
    this.request = props.request;
    this.results = props.results;
    this.models = props.models;
  }
}

export namespace Query {
  export type Handler<Request extends Shape, Results extends Shape, Models extends ReadModel[]> = (
    request: Shape.Value<Request>,
    ...models: ReadModel.Runtime<Models>
  ) => Promise<Shape.Value<Results>>;
}
