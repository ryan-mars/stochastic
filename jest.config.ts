import { Config } from "@jest/types"
import * as path from "path"

export default ((): Config.InitialOptions => ({
  cache: false,
  globals: {
    "ts-jest": {
      diagnostics: true,
      isolatedModules: true,
      tsconfig: path.resolve(__dirname, "tsconfig.base.json"),
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/[dist,lib,node_modules]/"],
  verbose: false,
  testTimeout: 60000,
}))()
