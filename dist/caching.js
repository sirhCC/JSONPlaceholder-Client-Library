"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStorageCacheStorage = exports.LocalStorageCacheStorage = exports.MemoryCacheStorage = exports.CacheManager = void 0;
// Optional caching features
var cache_1 = require("./cache");
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return cache_1.CacheManager; } });
Object.defineProperty(exports, "MemoryCacheStorage", { enumerable: true, get: function () { return cache_1.MemoryCacheStorage; } });
Object.defineProperty(exports, "LocalStorageCacheStorage", { enumerable: true, get: function () { return cache_1.LocalStorageCacheStorage; } });
Object.defineProperty(exports, "SessionStorageCacheStorage", { enumerable: true, get: function () { return cache_1.SessionStorageCacheStorage; } });
// Re-export core for convenience
__exportStar(require("./core"), exports);
//# sourceMappingURL=caching.js.map