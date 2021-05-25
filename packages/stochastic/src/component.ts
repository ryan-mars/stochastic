import { Store } from "./store"
import { Command } from "./command"
import { Policy } from "./policy"
import { ReadModel } from "./read-model"
import { DomainEvent } from "./event"
import { Query } from "./query"
import { EventHandler } from "./event-handler"

export type Component = Store | Command | DomainEvent<string, any, any> | EventHandler | Query | Policy | ReadModel

export interface BaseComponentProps {
  /**
   * Filename containing this Component's declaration.
   */
  readonly __filename: string
}

export abstract class BaseComponent {
  abstract readonly kind: Component["kind"]

  /**
   * Filename containing this Component's declaration.
   */
  readonly filename: string

  constructor(props: BaseComponentProps) {
    this.filename = props.__filename
  }
}
