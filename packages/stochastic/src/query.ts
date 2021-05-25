import { BaseComponent, BaseComponentProps } from "./component"
import { Shape } from "./shape"
import { ReadModel, ReadModelInterface } from "./read-model"
import { Init } from "./init"

/**
 * A query answers a question using one or more readModels
 */
export interface QueryProps<
  Question extends Shape = Shape,
  Answer extends Shape = Shape,
  ReadModels extends Record<string, ReadModel> = Record<string, ReadModel>
> extends BaseComponentProps {
  readonly question: Question
  readonly answer: Answer
  readonly reads: ReadModels
}

export class Query<
  Question extends Shape = Shape,
  Answer extends Shape = Shape,
  ReadModels extends Record<string, ReadModel> = Record<string, ReadModel>
> extends BaseComponent {
  readonly kind: "Query" = "Query"
  readonly question: Question
  readonly response: Answer
  readonly readModels: ReadModels
  constructor(
    props: QueryProps<Question, Answer, ReadModels>,
    readonly init: Query.Handler<Question, Answer, ReadModels>
  ) {
    super(props)
    this.question = props.question
    this.response = props.answer
    this.readModels = props.reads
  }
}

export namespace Query {
  export type Handler<Request extends Shape, Results extends Shape, Models extends Record<string, ReadModel>> = (
    models: {
      [m in keyof Models]: ReadModelInterface<Models[m]>
    },
    context: any
  ) => (request: Shape.Value<Request>, context: any) => Promise<Shape.Value<Results>>
}
