import { Struct } from "superstruct";
import { BaseComponent, BaseComponentProps } from "./component";
import { ReadModel } from "./read-model";

export interface QueryProps<
  Request = any,
  Results = any,
  Models extends ReadModel[] = ReadModel[]
> extends BaseComponentProps {
  readonly request: Struct<Request>;
  readonly results: Struct<Results>;
  readonly models: Models;
}

export class Query<
  Request = any,
  Results = any,
  Models extends ReadModel[] = ReadModel[]
> extends BaseComponent {
  readonly kind: "Query" = "Query";
  readonly request: Struct<Request>;
  readonly results: Struct<Results>;
  readonly models: Models;
  constructor(
    props: QueryProps<Request, Results, Models>,
    readonly query: Query.Handler<Request, Results, Models>
  ) {
    super(props);
    this.request = props.request;
    this.results = props.results;
    this.models = props.models;
  }
}

export namespace Query {
  export type Handler<Request, Results, Models extends ReadModel[]> = (
    request: Request,
    ...models: ReadModel.Runtime<Models>
  ) => Promise<Results>
}
