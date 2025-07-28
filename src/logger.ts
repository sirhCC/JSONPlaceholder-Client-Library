/**
 * Logger interface and implementation for the JSONPlaceholder Client Library
 * Provides configurable logging with different levels and silent mode for production
 */

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export interface ILogger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

/**
 * Default logger implementation
 */
export class Logger implements ILogger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;
  private colors: boolean;

  // Log level hierarchy (higher number = more verbose)
  private static readonly LEVELS: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  };

  // ANSI color codes for different log levels
  private static readonly COLORS: Record<Exclude<LogLevel, 'silent'>, string> & { reset: string } = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[35m', // Magenta
    reset: '\x1b[0m',  // Reset
  };

  constructor(config: LoggerConfig = { level: 'silent' }) {
    this.level = config.level;
    this.prefix = config.prefix || '[JsonPlaceholderClient]';
    this.timestamp = config.timestamp ?? false;
    this.colors = config.colors ?? (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = this.timestamp ? `[${new Date().toISOString()}] ` : '';
    const levelTag = `[${level.toUpperCase()}]`;
    const prefix = this.prefix ? `${this.prefix} ` : '';
    
    let formattedMessage = `${timestamp}${prefix}${levelTag} ${message}`;

    // Add colors if enabled
    if (this.colors && level !== 'silent' && Logger.COLORS[level as Exclude<LogLevel, 'silent'>]) {
      const colorCode = Logger.COLORS[level as Exclude<LogLevel, 'silent'>];
      formattedMessage = `${colorCode}${formattedMessage}${Logger.COLORS.reset}`;
    }

    // Use appropriate console method
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(formattedMessage, ...args);
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.LEVELS[level] <= Logger.LEVELS[this.level];
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    /* eslint-disable no-console */
    switch (level) {
      case 'error':
        return console.error;
      case 'warn':
        return console.warn;
      case 'info':
        return console.info;
      case 'debug':
        return console.debug || console.log;
      default:
        return console.log;
    }
    /* eslint-enable no-console */
  }
}

/**
 * Silent logger that never outputs anything
 */
export class SilentLogger implements ILogger {
  error(): void { /* silent */ }
  warn(): void { /* silent */ }
  info(): void { /* silent */ }
  debug(): void { /* silent */ }
  setLevel(): void { /* silent */ }
  getLevel(): LogLevel { return 'silent'; }
}

/**
 * Create a logger instance based on configuration
 */
export function createLogger(config?: Partial<LoggerConfig> | ILogger): ILogger {
  // If it's already a logger instance, return it
  if (config && typeof config === 'object' && 'error' in config && 'warn' in config) {
    return config as ILogger;
  }

  const loggerConfig = config as Partial<LoggerConfig> | undefined;

  // Default to silent in production environments
  const defaultLevel: LogLevel = 
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' 
      ? 'silent' 
      : 'warn';

  return new Logger({
    level: defaultLevel,
    timestamp: false,
    colors: true,
    ...loggerConfig,
  });
}

/**
 * Default logger instance
 */
export const defaultLogger = createLogger();
