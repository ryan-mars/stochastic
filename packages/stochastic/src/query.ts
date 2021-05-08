import {BaseComponent, BaseComponentProps} from "./component";
import {TypeConstructor} from "./type";
import {ReadModel} from "./read-model";

export interface QueryProps<Request = any, Results = any, Models extends ReadModel[] = ReadModel[]> extends BaseComponentProps {
  readonly request: TypeConstructor<Request>;
  readonly results: TypeConstructor<Results>;
  readonly models: Models;
}

export class Query<Request = any, Results = any, Models extends ReadModel[] = ReadModel[]> extends BaseComponent {
  readonly kind: "Query" = "Query";
  readonly request: TypeConstructor<Request>;
  readonly results: TypeConstructor<Results>;
  readonly models: Models;
  constructor(props: QueryProps<Request, Results, Models>, readonly query: Query.Handler<Request, Results, Models>) {
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
  ) => Promise<Results>;
}
