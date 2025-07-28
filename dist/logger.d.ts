/**
 * Logger interface and implementation for the JSONPlaceholder Client Library
 * Provides configurable logging with different levels and silent mode for production
 */
import { LogLevel, LoggerConfig, ILogger } from './types';
/**
 * Default logger implementation
 */
export declare class Logger implements ILogger {
    private level;
    private prefix;
    private timestamp;
    private colors;
    private static readonly LEVELS;
    private static readonly COLORS;
    constructor(config?: LoggerConfig);
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    private log;
    private shouldLog;
    private getConsoleMethod;
}
/**
 * Silent logger that never outputs anything
 */
export declare class SilentLogger implements ILogger {
    error(): void;
    warn(): void;
    info(): void;
    debug(): void;
    setLevel(): void;
    getLevel(): LogLevel;
}
/**
 * Create a logger instance based on configuration
 */
export declare function createLogger(config?: Partial<LoggerConfig> | ILogger): ILogger;
/**
 * Default logger instance
 */
export declare const defaultLogger: ILogger;
//# sourceMappingURL=logger.d.ts.map