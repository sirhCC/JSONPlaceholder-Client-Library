// Optional logging features
export {
  Logger,
  SilentLogger,
  createLogger
} from './logger';

export type {
  LogLevel,
  LoggerConfig,
  ILogger
} from './types';

// Re-export core for convenience
export * from './core';
