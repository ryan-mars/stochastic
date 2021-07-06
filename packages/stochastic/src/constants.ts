/**
 * Keys for globally known environment variables.
 */
export enum EnvironmentVariables {
  BoundedContextName = "BOUNDED_CONTEXT",
  ComponentName = "COMPONENT_NAME",
  EventStoreTableName = "EVENT_STORE_TABLE",
  LogLevel = "LOG_LEVEL",
}

export function getEnv(key: string): string {
  if (process.env[key] === undefined) {
    throw new Error(`environment variable not set: '${key}'`)
  }
  return process.env[key]!
}

export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Error = "error",
  Warn = "warn",
}
export const LogLevels: LogLevel[] = Object.values(LogLevel)

export function getLogLevel(): LogLevel | undefined {
  const logLevel = process.env[EnvironmentVariables.LogLevel]?.toLocaleLowerCase()
  if (logLevel === undefined) {
    return undefined
  } else if (LogLevels.includes(logLevel as LogLevel)) {
    return logLevel as LogLevel
  } else {
    throw new Error(`invalid log level '${logLevel}'`)
  }
}
