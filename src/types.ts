export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

export interface ApiError {
    status: number;
    error: string;
    message: string;
}

// Custom Error Classes
export class ApiClientError extends Error {
    public readonly status: number;
    public readonly response?: any;

    constructor(message: string, status: number, response?: any) {
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
    constructor(postId: number, response?: any) {
        super(`Post with ID ${postId} not found`, 404, response);
    }
}

export class ValidationError extends ApiClientError {
    public readonly validationErrors?: string[];

    constructor(message: string, validationErrors?: string[], response?: any) {
        super(message, 400, response);
        this.validationErrors = validationErrors;
    }
}

export class ServerError extends ApiClientError {
    constructor(message: string = 'Internal server error', response?: any) {
        super(message, 500, response);
    }
}

export class RateLimitError extends ApiClientError {
    public readonly retryAfter?: number;

    constructor(retryAfter?: number, response?: any) {
        super('Rate limit exceeded. Please try again later.', 429, response);
        this.retryAfter = retryAfter;
    }
}

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}