import { Aggregate } from "./aggregate";
import { Command } from "./command";
import { DomainEvent } from "./event";
import { Policy } from "./policy";
import { Query } from "./query";
import { ReadModel } from "./read-model";

export type Component = Command | Aggregate | DomainEvent | Policy | ReadModel | Query;

export interface BaseComponentProps {
  /**
   * Filename containing this Component's declaration.
   */
  readonly __filename: string;
}

export abstract class BaseComponent {
  abstract readonly kind: Component["kind"];

  /**
   * Filename containing this Component's declaration.
   */
  readonly filename: string;

  constructor(
    props: BaseComponentProps,
    /**
     * Name of the entrypoint in the file.
     */
    readonly handler?: string,
  ) {
    this.filename = props.__filename;
  }
}
