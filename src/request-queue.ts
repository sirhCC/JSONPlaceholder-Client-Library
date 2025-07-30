/**
 * Request Queue Management for handling outages and traffic spikes
 * Provides intelligent request queuing, prioritization, and backpressure
 */

/**
 * Request priority levels
 */
export enum RequestPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxSize: number;              // Maximum queue size
  maxConcurrent: number;        // Max concurrent requests
  timeout: number;              // Request timeout in queue
  priorityEnabled: boolean;     // Enable priority queuing
  rateLimitPerSecond: number;   // Max requests per second
  backpressureThreshold: number; // Queue size to trigger backpressure
  retryFailedRequests: boolean; // Auto-retry failed requests
}

/**
 * Queued request item
 */
export interface QueuedRequest<T = unknown> {
  id: string;
  operation: () => Promise<T>;
  priority: RequestPriority;
  timestamp: number;
  timeout: number;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  queueSize: number;
  activeRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageWaitTime: number;
  averageProcessTime: number;
  throughputPerSecond: number;
  backpressureActive: boolean;
  priorityDistribution: Record<RequestPriority, number>;
}

/**
 * Request queue manager with advanced features
 */
export class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeRequests = new Set<string>();
  private completedRequests = 0;
  private failedRequests = 0;
  private totalWaitTime = 0;
  private totalProcessTime = 0;
  private lastThroughputReset = Date.now();
  private recentCompletions = 0;
  private isProcessing = false;
  private requestCounter = 0;

  constructor(private config: QueueConfig) {
    // Start processing queue
    this.startProcessing();
    
    // Start throughput tracking
    setInterval(() => this.resetThroughputCounters(), 1000);
  }

  /**
   * Add request to queue
   */
  async enqueue<T>(
    operation: () => Promise<T>,
    options: {
      priority?: RequestPriority;
      timeout?: number;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<T> {
    // Check queue capacity
    if (this.queue.length >= this.config.maxSize) {
      throw new Error(`Queue is full (${this.config.maxSize} items)`);
    }

    // Check backpressure
    if (this.isBackpressureActive()) {
      throw new Error('Queue backpressure active - too many pending requests');
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${++this.requestCounter}_${Date.now()}`;
      
      const queuedRequest: QueuedRequest<T> = {
        id: requestId,
        operation,
        priority: options.priority ?? RequestPriority.NORMAL,
        timestamp: Date.now(),
        timeout: options.timeout ?? this.config.timeout,
        resolve,
        reject,
        retryCount: 0,
        maxRetries: options.maxRetries ?? 0,
        metadata: options.metadata
      };

      // Insert based on priority if enabled
      if (this.config.priorityEnabled) {
        this.insertByPriority(queuedRequest as QueuedRequest<unknown>);
      } else {
        this.queue.push(queuedRequest as QueuedRequest<unknown>);
      }

      // Set timeout for request
      setTimeout(() => {
        this.timeoutRequest(requestId);
      }, queuedRequest.timeout);
    });
  }

  /**
   * Insert request by priority
   */
  private insertByPriority(request: QueuedRequest<unknown>): void {
    let insertIndex = this.queue.length;
    
    // Find insertion point - higher priority goes first
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < request.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, request);
  }

  /**
   * Start processing requests from queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Process requests from queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      // Wait if at concurrent limit or rate limit
      if (this.activeRequests.size >= this.config.maxConcurrent || 
          this.isRateLimited()) {
        await this.sleep(100);
        continue;
      }

      // Get next request
      const request = this.queue.shift();
      if (!request) {
        await this.sleep(50);
        continue;
      }

      // Process request
      this.processRequest(request);
    }
  }

  /**
   * Process individual request
   */
  private async processRequest<T>(request: QueuedRequest<T>): Promise<void> {
    const startTime = Date.now();
    const waitTime = startTime - request.timestamp;
    
    this.activeRequests.add(request.id);
    this.totalWaitTime += waitTime;

    try {
      const result = await request.operation();
      
      const processTime = Date.now() - startTime;
      this.totalProcessTime += processTime;
      this.completedRequests++;
      this.recentCompletions++;
      
      request.resolve(result);
    } catch (error) {
      // Handle retry logic
      if (this.config.retryFailedRequests && 
          request.retryCount < request.maxRetries) {
        request.retryCount++;
        
        // Re-queue with exponential backoff
        setTimeout(() => {
          if (this.config.priorityEnabled) {
            this.insertByPriority(request as QueuedRequest<unknown>);
          } else {
            this.queue.unshift(request as QueuedRequest<unknown>); // Priority for retries
          }
        }, Math.pow(2, request.retryCount) * 1000);
      } else {
        this.failedRequests++;
        request.reject(error as Error);
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Timeout a request
   */
  private timeoutRequest(requestId: string): void {
    // Remove from queue if still waiting
    const queueIndex = this.queue.findIndex(req => req.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0];
      request.reject(new Error(`Request ${requestId} timed out in queue`));
      this.failedRequests++;
    }
  }

  /**
   * Check if backpressure should be applied
   */
  private isBackpressureActive(): boolean {
    return this.queue.length >= this.config.backpressureThreshold;
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    const secondsSinceReset = (now - this.lastThroughputReset) / 1000;
    const currentRate = this.recentCompletions / Math.max(secondsSinceReset, 0.1);
    
    return currentRate >= this.config.rateLimitPerSecond;
  }

  /**
   * Reset throughput counters
   */
  private resetThroughputCounters(): void {
    this.recentCompletions = 0;
    this.lastThroughputReset = Date.now();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const totalRequests = this.completedRequests + this.failedRequests;
    const averageWaitTime = totalRequests > 0 ? this.totalWaitTime / totalRequests : 0;
    const averageProcessTime = this.completedRequests > 0 ? this.totalProcessTime / this.completedRequests : 0;
    
    // Calculate throughput
    const now = Date.now();
    const secondsSinceReset = (now - this.lastThroughputReset) / 1000;
    const throughputPerSecond = this.recentCompletions / Math.max(secondsSinceReset, 0.1);

    // Calculate priority distribution
    const priorityDistribution: Record<RequestPriority, number> = {
      [RequestPriority.LOW]: 0,
      [RequestPriority.NORMAL]: 0,
      [RequestPriority.HIGH]: 0,
      [RequestPriority.CRITICAL]: 0
    };

    this.queue.forEach(request => {
      priorityDistribution[request.priority]++;
    });

    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
      completedRequests: this.completedRequests,
      failedRequests: this.failedRequests,
      averageWaitTime,
      averageProcessTime,
      throughputPerSecond,
      backpressureActive: this.isBackpressureActive(),
      priorityDistribution
    };
  }

  /**
   * Clear queue and reject all pending requests
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.isProcessing = false;
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Update queue configuration
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get queue health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check queue size
    if (stats.queueSize > this.config.maxSize * 0.8) {
      status = 'warning';
      issues.push('Queue is near capacity');
      recommendations.push('Consider increasing maxSize or reducing request rate');
    }

    // Check backpressure
    if (stats.backpressureActive) {
      status = 'critical';
      issues.push('Backpressure is active');
      recommendations.push('Reduce request rate or increase processing capacity');
    }

    // Check failure rate
    const totalRequests = stats.completedRequests + stats.failedRequests;
    if (totalRequests > 0) {
      const failureRate = stats.failedRequests / totalRequests;
      if (failureRate > 0.1) {
        status = failureRate > 0.25 ? 'critical' : 'warning';
        issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
        recommendations.push('Check error handling and retry configuration');
      }
    }

    // Check wait times
    if (stats.averageWaitTime > this.config.timeout * 0.5) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push('High average wait time');
      recommendations.push('Increase concurrent processing or reduce request rate');
    }

    return { status, issues, recommendations };
  }
}

/**
 * Factory for creating queues with different configurations
 */
export class QueueFactory {
  /**
   * Create high-throughput queue
   */
  static createHighThroughputQueue(): RequestQueue {
    return new RequestQueue({
      maxSize: 10000,
      maxConcurrent: 50,
      timeout: 30000,
      priorityEnabled: false,
      rateLimitPerSecond: 100,
      backpressureThreshold: 8000,
      retryFailedRequests: true
    });
  }

  /**
   * Create priority queue
   */
  static createPriorityQueue(): RequestQueue {
    return new RequestQueue({
      maxSize: 5000,
      maxConcurrent: 20,
      timeout: 60000,
      priorityEnabled: true,
      rateLimitPerSecond: 50,
      backpressureThreshold: 4000,
      retryFailedRequests: true
    });
  }

  /**
   * Create conservative queue
   */
  static createConservativeQueue(): RequestQueue {
    return new RequestQueue({
      maxSize: 1000,
      maxConcurrent: 10,
      timeout: 120000,
      priorityEnabled: true,
      rateLimitPerSecond: 20,
      backpressureThreshold: 800,
      retryFailedRequests: false
    });
  }
}
