// Custom Error Classes
export class ApiClientError extends Error {
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
export class PostNotFoundError extends ApiClientError {
    constructor(postId, response) {
        super(`Post with ID ${postId} not found`, 404, response);
    }
}
export class ValidationError extends ApiClientError {
    constructor(message, validationErrors, response) {
        super(message, 400, response);
        this.validationErrors = validationErrors;
    }
}
export class ServerError extends ApiClientError {
    constructor(message = 'Internal server error', response) {
        super(message, 500, response);
    }
}
export class RateLimitError extends ApiClientError {
    constructor(retryAfter, response) {
        super('Rate limit exceeded. Please try again later.', 429, response);
        this.retryAfter = retryAfter;
    }
}
//# sourceMappingURL=types.js.map