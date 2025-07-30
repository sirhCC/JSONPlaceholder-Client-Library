"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ServerError = exports.ValidationError = exports.PostNotFoundError = exports.ApiClientError = void 0;
// Custom Error Classes
class ApiClientError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.response = response;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.ApiClientError = ApiClientError;
class PostNotFoundError extends ApiClientError {
    constructor(postId, response) {
        super(`Post with ID ${postId} not found`, 404, response);
    }
}
exports.PostNotFoundError = PostNotFoundError;
class ValidationError extends ApiClientError {
    constructor(message, validationErrors, response) {
        super(message, 400, response);
        this.validationErrors = validationErrors;
    }
}
exports.ValidationError = ValidationError;
class ServerError extends ApiClientError {
    constructor(message = 'Internal server error', response) {
        super(message, 500, response);
    }
}
exports.ServerError = ServerError;
class RateLimitError extends ApiClientError {
    constructor(retryAfter, response) {
        super('Rate limit exceeded. Please try again later.', 429, response);
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=types.js.map