"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.createLogger = exports.SilentLogger = exports.Logger = exports.SessionStorageCacheStorage = exports.LocalStorageCacheStorage = exports.MemoryCacheStorage = exports.CacheManager = exports.RateLimitError = exports.ServerError = exports.ValidationError = exports.PostNotFoundError = exports.ApiClientError = exports.JsonPlaceholderClient = void 0;
// Main client export
var client_1 = require("./client");
Object.defineProperty(exports, "JsonPlaceholderClient", { enumerable: true, get: function () { return client_1.JsonPlaceholderClient; } });
// Error types - lightweight
var types_1 = require("./types");
Object.defineProperty(exports, "ApiClientError", { enumerable: true, get: function () { return types_1.ApiClientError; } });
Object.defineProperty(exports, "PostNotFoundError", { enumerable: true, get: function () { return types_1.PostNotFoundError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return types_1.ValidationError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return types_1.ServerError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return types_1.RateLimitError; } });
var cache_1 = require("./cache");
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return cache_1.CacheManager; } });
Object.defineProperty(exports, "MemoryCacheStorage", { enumerable: true, get: function () { return cache_1.MemoryCacheStorage; } });
Object.defineProperty(exports, "LocalStorageCacheStorage", { enumerable: true, get: function () { return cache_1.LocalStorageCacheStorage; } });
Object.defineProperty(exports, "SessionStorageCacheStorage", { enumerable: true, get: function () { return cache_1.SessionStorageCacheStorage; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
Object.defineProperty(exports, "SilentLogger", { enumerable: true, get: function () { return logger_1.SilentLogger; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
Object.defineProperty(exports, "defaultLogger", { enumerable: true, get: function () { return logger_1.defaultLogger; } });
//# sourceMappingURL=index.js.map