import { Shape } from "./shape"

export class Config<Name extends string = string, T extends Shape = Shape> {
  readonly kind: "Config"
  constructor(readonly name: Name, readonly shape: T) {}
}

export type ConfigRuntime<C extends readonly Config[]> = {
  [i in C[number]["name"]]: Shape.Value<C[number]["shape"]>
}
