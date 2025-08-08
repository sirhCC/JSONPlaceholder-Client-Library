/**
 * Rate Limiter - Advanced request rate limiting for API protection
 * 
 * Features:
 * - Multiple rate limiting strategies (token bucket, sliding window, fixed window)
 * - Per-endpoint rate limiting
 * - Global rate limiting
 * - Queue management with priority
 * - Automatic retry with backoff
 * - Rate limit analytics and monitoring
 */

export interface RateLimitConfig {
  /** Enable rate limiting */
  enabled: boolean;
  
  /** Rate limiting strategy */
  strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';
  
  /** Maximum requests per time window */
  maxRequests: number;
  
  /** Time window in milliseconds */
  windowMs: number;
  
  /** Maximum number of queued requests */
  maxQueueSize: number;
  
  /** Skip rate limiting for certain endpoints */
  skipEndpoints: string[];
  
  /** Per-endpoint specific limits */
  endpointLimits: Record<string, {
    maxRequests: number;
    windowMs: number;
  }>;
  
  /** Retry configuration for rate-limited requests */
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    exponentialBackoff: boolean;
  };
  
  /** Enable detailed analytics */
  enableAnalytics: boolean;
  
  /** Custom headers to include rate limit info */
  includeHeaders: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
  limit: number;
  resetTime: number;
}

export interface RateLimitAnalytics {
  totalRequests: number;
  blockedRequests: number;
  queuedRequests: number;
  averageWaitTime: number;
  peakRequestsPerSecond: number;
  currentQueueSize: number;
  endpointStats: Record<string, {
    requests: number;
    blocked: number;
    averageLatency: number;
  }>;
}

interface QueuedRequest {
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
  endpoint: string;
  priority: number;
  timestamp: number;
}

interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

interface SlidingWindowState {
  requests: number[];
}

interface FixedWindowState {
  requests: number;
  windowStart: number;
}

/**
 * Advanced Rate Limiter with multiple strategies and analytics
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private globalState!: TokenBucketState | SlidingWindowState | FixedWindowState;
  private endpointStates: Map<string, TokenBucketState | SlidingWindowState | FixedWindowState>;
  private requestQueue: QueuedRequest[];
  private analytics: RateLimitAnalytics;
  private isProcessingQueue: boolean;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      enabled: true,
      strategy: 'token-bucket',
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      maxQueueSize: 50,
      skipEndpoints: [],
      endpointLimits: {},
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        exponentialBackoff: true
      },
      enableAnalytics: true,
      includeHeaders: true,
      ...config
    };

    this.endpointStates = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    this.analytics = {
      totalRequests: 0,
      blockedRequests: 0,
      queuedRequests: 0,
      averageWaitTime: 0,
      peakRequestsPerSecond: 0,
      currentQueueSize: 0,
      endpointStats: {}
    };

    this.initializeGlobalState();
  }

  /**
   * Check if a request is allowed under current rate limits
   */
  async checkLimit(endpoint: string, priority: number = 0): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }

    // Skip rate limiting for certain endpoints
    if (this.config.skipEndpoints.includes(endpoint)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }

    this.updateAnalytics('request', endpoint);

    // Check global rate limit
    const globalResult = this.checkGlobalLimit();
    
    // Check endpoint-specific rate limit
    const endpointResult = this.checkEndpointLimit(endpoint);

    // Both must allow the request
    const allowed = globalResult.allowed && endpointResult.allowed;
    
    if (!allowed) {
      this.updateAnalytics('blocked', endpoint);
      
      // Try to queue the request if there's space
      if (this.requestQueue.length < this.config.maxQueueSize) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            resolve: (allowed: boolean) => {
              resolve({
                allowed,
                retryAfter: allowed ? 0 : Math.max(globalResult.retryAfter || 0, endpointResult.retryAfter || 0),
                remaining: Math.min(globalResult.remaining, endpointResult.remaining),
                limit: Math.min(globalResult.limit, endpointResult.limit),
                resetTime: Math.max(globalResult.resetTime, endpointResult.resetTime)
              });
            },
            reject,
            endpoint,
            priority,
            timestamp: Date.now()
          });
          
          this.updateAnalytics('queued', endpoint);
          this.processQueue();
        });
      }
    }

    return {
      allowed,
      retryAfter: allowed ? 0 : Math.max(globalResult.retryAfter || 0, endpointResult.retryAfter || 0),
      remaining: Math.min(globalResult.remaining, endpointResult.remaining),
      limit: Math.min(globalResult.limit, endpointResult.limit),
      resetTime: Math.max(globalResult.resetTime, endpointResult.resetTime)
    };
  }

  /**
   * Get current rate limiting analytics
   */
  getAnalytics(): RateLimitAnalytics {
    this.analytics.currentQueueSize = this.requestQueue.length;
    return { ...this.analytics };
  }

  /**
   * Reset rate limiting state
   */
  reset(): void {
    this.initializeGlobalState();
    this.endpointStates.clear();
    this.requestQueue.length = 0;
    
    if (this.config.enableAnalytics) {
      this.analytics = {
        totalRequests: 0,
        blockedRequests: 0,
        queuedRequests: 0,
        averageWaitTime: 0,
        peakRequestsPerSecond: 0,
        currentQueueSize: 0,
        endpointStats: {}
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeGlobalState();
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    if (!this.config.includeHeaders) {
      return {};
    }

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    };

    if (result.retryAfter && result.retryAfter > 0) {
      headers['Retry-After'] = Math.ceil(result.retryAfter / 1000).toString();
    }

    return headers;
  }

  private initializeGlobalState(): void {
    const now = Date.now();
    
    switch (this.config.strategy) {
      case 'token-bucket':
        this.globalState = {
          tokens: this.config.maxRequests,
          lastRefill: now
        } as TokenBucketState;
        break;
        
      case 'sliding-window':
        this.globalState = {
          requests: []
        } as SlidingWindowState;
        break;
        
      case 'fixed-window':
        this.globalState = {
          requests: 0,
          windowStart: now
        } as FixedWindowState;
        break;
    }
  }

  private checkGlobalLimit(): RateLimitResult {
    return this.checkLimitForState(
      this.globalState,
      this.config.maxRequests,
      this.config.windowMs
    );
  }

  private checkEndpointLimit(endpoint: string): RateLimitResult {
    const endpointConfig = this.config.endpointLimits[endpoint];
    
    if (!endpointConfig) {
      // No specific limit for this endpoint, use global limits
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }

    if (!this.endpointStates.has(endpoint)) {
      this.initializeEndpointState(endpoint, endpointConfig);
    }

    const state = this.endpointStates.get(endpoint)!;
    return this.checkLimitForState(
      state,
      endpointConfig.maxRequests,
      endpointConfig.windowMs
    );
  }

  private initializeEndpointState(endpoint: string, config: { maxRequests: number; windowMs: number }): void {
    const now = Date.now();
    
    switch (this.config.strategy) {
      case 'token-bucket':
        this.endpointStates.set(endpoint, {
          tokens: config.maxRequests,
          lastRefill: now
        } as TokenBucketState);
        break;
        
      case 'sliding-window':
        this.endpointStates.set(endpoint, {
          requests: []
        } as SlidingWindowState);
        break;
        
      case 'fixed-window':
        this.endpointStates.set(endpoint, {
          requests: 0,
          windowStart: now
        } as FixedWindowState);
        break;
    }
  }

  private checkLimitForState(
    state: TokenBucketState | SlidingWindowState | FixedWindowState,
    maxRequests: number,
    windowMs: number
  ): RateLimitResult {
    const now = Date.now();

    switch (this.config.strategy) {
      case 'token-bucket':
        return this.checkTokenBucket(state as TokenBucketState, maxRequests, windowMs, now);
        
      case 'sliding-window':
        return this.checkSlidingWindow(state as SlidingWindowState, maxRequests, windowMs, now);
        
      case 'fixed-window':
        return this.checkFixedWindow(state as FixedWindowState, maxRequests, windowMs, now);
        
      default:
        throw new Error(`Unknown rate limiting strategy: ${this.config.strategy}`);
    }
  }

  private checkTokenBucket(
    state: TokenBucketState,
    maxRequests: number,
    windowMs: number,
    now: number
  ): RateLimitResult {
    // Refill tokens based on time passed
    const timePassed = now - state.lastRefill;
    // Refill rate: tokens per millisecond
    const refillRate = maxRequests / windowMs;
    const tokensToAdd = timePassed * refillRate;
    
    if (tokensToAdd > 0) {
      state.tokens = Math.min(maxRequests, state.tokens + tokensToAdd);
      state.lastRefill = now;
    }

    const allowed = state.tokens >= 1;
    
    if (allowed) {
      state.tokens -= 1;
    }

    // Calculate when next token will be available
    const tokensNeeded = Math.max(0, 1 - state.tokens);
    const timeToNextToken = tokensNeeded > 0 ? Math.ceil(tokensNeeded / refillRate) : 0;

    return {
      allowed,
      remaining: Math.floor(state.tokens),
      limit: maxRequests,
      resetTime: state.lastRefill + windowMs,
      retryAfter: timeToNextToken
    };
  }

  private checkSlidingWindow(
    state: SlidingWindowState,
    maxRequests: number,
    windowMs: number,
    now: number
  ): RateLimitResult {
    // Remove old requests outside the window
    const windowStart = now - windowMs;
    state.requests = state.requests.filter(time => time > windowStart);

    const allowed = state.requests.length < maxRequests;
    
    if (allowed) {
      state.requests.push(now);
    }

    const resetTime = state.requests.length > 0 ? state.requests[0] + windowMs : now + windowMs;

    return {
      allowed,
      remaining: maxRequests - state.requests.length,
      limit: maxRequests,
      resetTime,
      retryAfter: allowed ? 0 : resetTime - now
    };
  }

  private checkFixedWindow(
    state: FixedWindowState,
    maxRequests: number,
    windowMs: number,
    now: number
  ): RateLimitResult {
    // Check if we're in a new window
    if (now - state.windowStart >= windowMs) {
      state.requests = 0;
      state.windowStart = now;
    }

    const allowed = state.requests < maxRequests;
    
    if (allowed) {
      state.requests++;
    }

    const resetTime = state.windowStart + windowMs;

    return {
      allowed,
      remaining: maxRequests - state.requests,
      limit: maxRequests,
      resetTime,
      retryAfter: allowed ? 0 : resetTime - now
    };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Sort queue by priority (higher first) and timestamp (older first)
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      const processed: QueuedRequest[] = [];

      for (const queuedRequest of this.requestQueue) {
        const result = this.checkEndpointLimit(queuedRequest.endpoint);
        const globalResult = this.checkGlobalLimit();
        
        if (result.allowed && globalResult.allowed) {
          const waitTime = Date.now() - queuedRequest.timestamp;
          this.updateAnalyticsWaitTime(waitTime);
          
          queuedRequest.resolve(true);
          processed.push(queuedRequest);
        }
      }

      // Remove processed requests from queue
      this.requestQueue = this.requestQueue.filter(req => !processed.includes(req));

      // Schedule next processing if queue is not empty
      if (this.requestQueue.length > 0) {
        setTimeout(() => {
          this.isProcessingQueue = false;
          this.processQueue();
        }, 100); // Check every 100ms
      } else {
        this.isProcessingQueue = false;
      }
  } catch {
      this.isProcessingQueue = false;
      // Reject all queued requests on error
      this.requestQueue.forEach(req => req.reject(new Error('Rate limiter processing error')));
      this.requestQueue.length = 0;
    }
  }

  private updateAnalytics(type: 'request' | 'blocked' | 'queued', endpoint: string): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    switch (type) {
      case 'request':
        this.analytics.totalRequests++;
        break;
      case 'blocked':
        this.analytics.blockedRequests++;
        break;
      case 'queued':
        this.analytics.queuedRequests++;
        break;
    }

    // Update endpoint-specific stats
    if (!this.analytics.endpointStats[endpoint]) {
      this.analytics.endpointStats[endpoint] = {
        requests: 0,
        blocked: 0,
        averageLatency: 0
      };
    }

    const endpointStats = this.analytics.endpointStats[endpoint];
    
    switch (type) {
      case 'request':
        endpointStats.requests++;
        break;
      case 'blocked':
        endpointStats.blocked++;
        break;
    }
  }

  private updateAnalyticsWaitTime(waitTime: number): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    const totalWaitTime = this.analytics.averageWaitTime * (this.analytics.queuedRequests - 1) + waitTime;
    this.analytics.averageWaitTime = totalWaitTime / this.analytics.queuedRequests;
  }
}

/**
 * Rate Limiting Error thrown when requests are rejected
 */
export class RateLimitingError extends Error {
  public readonly retryAfter: number;
  public readonly limit: number;
  public readonly remaining: number;
  public readonly resetTime: number;

  constructor(message: string, result: RateLimitResult) {
    super(message);
    this.name = 'RateLimitingError';
    this.retryAfter = result.retryAfter || 0;
    this.limit = result.limit;
    this.remaining = result.remaining;
    this.resetTime = result.resetTime;
  }
}
