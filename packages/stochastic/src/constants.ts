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
  Debug = 3,
  Info = 2,
  Error = 0,
}
export const LogLevels = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  error: LogLevel.Error,
}

export function getLogLevel(): LogLevel | undefined {
  const logLevel = process.env[EnvironmentVariables.LogLevel]?.toLocaleLowerCase()
  if (logLevel === undefined) {
    return undefined
  } else if (LogLevels[logLevel as keyof typeof LogLevels] !== undefined) {
    return LogLevels[logLevel as keyof typeof LogLevels]
  } else {
    throw new Error(`invalid log level '${logLevel}'`)
  }
}
