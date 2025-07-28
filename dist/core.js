"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ServerError = exports.ValidationError = exports.PostNotFoundError = exports.ApiClientError = exports.JsonPlaceholderClient = void 0;
// Lightweight client without caching
var client_1 = require("./client");
Object.defineProperty(exports, "JsonPlaceholderClient", { enumerable: true, get: function () { return client_1.JsonPlaceholderClient; } });
// Core errors
var types_1 = require("./types");
Object.defineProperty(exports, "ApiClientError", { enumerable: true, get: function () { return types_1.ApiClientError; } });
Object.defineProperty(exports, "PostNotFoundError", { enumerable: true, get: function () { return types_1.PostNotFoundError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return types_1.ValidationError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return types_1.ServerError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return types_1.RateLimitError; } });
//# sourceMappingURL=core.js.map