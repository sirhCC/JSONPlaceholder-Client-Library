"use strict";
/**
 * Logger interface and implementation for the JSONPlaceholder Client Library
 * Provides configurable logging with different levels and silent mode for production
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.SilentLogger = exports.Logger = void 0;
exports.createLogger = createLogger;
/**
 * Default logger implementation
 */
class Logger {
    constructor(config = { level: 'silent' }) {
        this.level = config.level;
        this.prefix = config.prefix || '[JsonPlaceholderClient]';
        this.timestamp = config.timestamp ?? false;
        this.colors = config.colors ?? (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
    }
    error(message, ...args) {
        this.log('error', message, ...args);
    }
    warn(message, ...args) {
        this.log('warn', message, ...args);
    }
    info(message, ...args) {
        this.log('info', message, ...args);
    }
    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
    log(level, message, ...args) {
        if (!this.shouldLog(level)) {
            return;
        }
        const timestamp = this.timestamp ? `[${new Date().toISOString()}] ` : '';
        const levelTag = `[${level.toUpperCase()}]`;
        const prefix = this.prefix ? `${this.prefix} ` : '';
        let formattedMessage = `${timestamp}${prefix}${levelTag} ${message}`;
        // Add colors if enabled
        if (this.colors && level !== 'silent' && Logger.COLORS[level]) {
            const colorCode = Logger.COLORS[level];
            formattedMessage = `${colorCode}${formattedMessage}${Logger.COLORS.reset}`;
        }
        // Use appropriate console method
        const consoleMethod = this.getConsoleMethod(level);
        consoleMethod(formattedMessage, ...args);
    }
    shouldLog(level) {
        return Logger.LEVELS[level] <= Logger.LEVELS[this.level];
    }
    getConsoleMethod(level) {
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
exports.Logger = Logger;
// Log level hierarchy (higher number = more verbose)
Logger.LEVELS = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};
// ANSI color codes for different log levels
Logger.COLORS = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    info: '\x1b[36m', // Cyan
    debug: '\x1b[35m', // Magenta
    reset: '\x1b[0m', // Reset
};
/**
 * Silent logger that never outputs anything
 */
class SilentLogger {
    error() { }
    warn() { }
    info() { }
    debug() { }
    setLevel() { }
    getLevel() { return 'silent'; }
}
exports.SilentLogger = SilentLogger;
/**
 * Create a logger instance based on configuration
 */
function createLogger(config) {
    // If it's already a logger instance, return it
    if (config && typeof config === 'object' && 'error' in config && 'warn' in config) {
        return config;
    }
    const loggerConfig = config;
    // Default to silent in production environments
    const defaultLevel = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
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
exports.defaultLogger = createLogger();
//# sourceMappingURL=logger.js.map