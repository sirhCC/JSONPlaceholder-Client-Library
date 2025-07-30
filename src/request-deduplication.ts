/**
 * Advanced request deduplication system
 * Prevents duplicate requests across all client methods and provides intelligent caching
 */

import { JsonPlaceholderClient } from './client';

/**
 * Request signature for deduplication
 */
interface RequestSignature {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * In-flight request tracking
 */
interface InFlightRequest {
  promise: Promise<unknown>;
  timestamp: number;
  abortController: AbortController;
  requestCount: number;
}

/**
 * Deduplication statistics
 */
interface DeduplicationStats {
  totalRequests: number;
  deduplicatedRequests: number;
  duplicatesSaved: number;
  currentInFlight: number;
  averageRequestTime: number;
}

/**
 * Request deduplication manager
 */
export class RequestDeduplicationManager {
  private inFlightRequests = new Map<string, InFlightRequest>();
  private stats: DeduplicationStats = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    duplicatesSaved: 0,
    currentInFlight: 0,
    averageRequestTime: 0,
  };
  private requestTimes: number[] = [];
  private maxRequestLifetime = 30000; // 30 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxLifetime = 30000) {
    this.maxRequestLifetime = maxLifetime;
    this.startCleanupInterval();
  }

  /**
   * Generate a unique key for request deduplication
   */
  private generateRequestKey(signature: RequestSignature): string {
    const keyData = {
      method: signature.method,
      url: signature.url,
      params: signature.params || {},
      body: signature.body,
      headers: signature.headers || {},
    };
    
    return JSON.stringify(keyData);
  }

  /**
   * Execute a request with deduplication
   */
  async executeRequest<T>(
    signature: RequestSignature,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateRequestKey(signature);
    this.stats.totalRequests++;

    // Check if request is already in flight
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      this.stats.deduplicatedRequests++;
      this.stats.duplicatesSaved++;
      existing.requestCount++;
      
      try {
        return await existing.promise as T;
      } catch (error) {
        // If the existing request failed, remove it and try again
        this.inFlightRequests.delete(key);
        throw error;
      }
    }

    // Create new request
    const abortController = new AbortController();
    const startTime = Date.now();
    
    const requestPromise = this.executeWithTimeout(requestFn, abortController);
    
    const inFlightRequest: InFlightRequest = {
      promise: requestPromise,
      timestamp: startTime,
      abortController,
      requestCount: 1,
    };

    this.inFlightRequests.set(key, inFlightRequest);
    this.stats.currentInFlight = this.inFlightRequests.size;

    try {
      const result = await requestPromise;
      const requestTime = Date.now() - startTime;
      
      this.recordRequestTime(requestTime);
      
      return result as T;
    } finally {
      this.inFlightRequests.delete(key);
      this.stats.currentInFlight = this.inFlightRequests.size;
    }
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout<T>(
    requestFn: () => Promise<T>,
    abortController: AbortController
  ): Promise<T> {
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.maxRequestLifetime);

    try {
      const result = await requestFn();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Record request timing for statistics
   */
  private recordRequestTime(time: number): void {
    this.requestTimes.push(time);
    
    // Keep only last 100 request times for average calculation
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }
    
    this.stats.averageRequestTime = 
      this.requestTimes.reduce((sum, t) => sum + t, 0) / this.requestTimes.length;
  }

  /**
   * Start cleanup interval for expired requests
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRequests();
    }, 10000); // Cleanup every 10 seconds
  }

  /**
   * Clean up expired in-flight requests
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.inFlightRequests.forEach((request, key) => {
      if (now - request.timestamp > this.maxRequestLifetime) {
        request.abortController.abort();
        expired.push(key);
      }
    });

    expired.forEach(key => {
      this.inFlightRequests.delete(key);
    });

    this.stats.currentInFlight = this.inFlightRequests.size;
  }

  /**
   * Get deduplication statistics
   */
  getStats(): DeduplicationStats & { deduplicationRate: string } {
    const deduplicationRate = this.stats.totalRequests > 0 
      ? ((this.stats.deduplicatedRequests / this.stats.totalRequests) * 100).toFixed(1) + '%'
      : '0%';

    return {
      ...this.stats,
      deduplicationRate,
    };
  }

  /**
   * Clear all in-flight requests
   */
  clearAll(): void {
    this.inFlightRequests.forEach(request => {
      request.abortController.abort();
    });
    this.inFlightRequests.clear();
    this.stats.currentInFlight = 0;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      duplicatesSaved: 0,
      currentInFlight: this.inFlightRequests.size,
      averageRequestTime: 0,
    };
    this.requestTimes = [];
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

/**
 * Enhanced client wrapper with request deduplication
 */
export class DeduplicatedJsonPlaceholderClient extends JsonPlaceholderClient {
  private deduplicationManager: RequestDeduplicationManager;

  constructor(baseURL?: string, config?: any) {
    super(baseURL, config);
    this.deduplicationManager = new RequestDeduplicationManager();
  }

  /**
   * Override getPosts with deduplication
   */
  async getPosts(options?: any): Promise<any> {
    const signature: RequestSignature = {
      method: 'GET',
      url: '/posts',
      params: options,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.getPosts(options)
    );
  }

  /**
   * Override getPost with deduplication
   */
  async getPost(id: number): Promise<any> {
    const signature: RequestSignature = {
      method: 'GET',
      url: `/posts/${id}`,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.getPost(id)
    );
  }

  /**
   * Override getComments with deduplication
   */
  async getComments(options?: any): Promise<any> {
    const signature: RequestSignature = {
      method: 'GET',
      url: '/comments',
      params: options,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.getComments(options)
    );
  }

  /**
   * Override getUsers with deduplication
   */
  async getUsers(options?: any): Promise<any> {
    const signature: RequestSignature = {
      method: 'GET',
      url: '/users',
      params: options,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.getUsers(options)
    );
  }

  /**
   * Override getUser with deduplication
   */
  async getUser(id: number): Promise<any> {
    const signature: RequestSignature = {
      method: 'GET',
      url: `/users/${id}`,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.getUser(id)
    );
  }

  /**
   * Override createPost with deduplication (for identical creates)
   */
  async createPost(postData: any): Promise<any> {
    const signature: RequestSignature = {
      method: 'POST',
      url: '/posts',
      body: postData,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.createPost(postData)
    );
  }

  /**
   * Override updatePost with deduplication
   */
  async updatePost(id: number, postData: any): Promise<any> {
    const signature: RequestSignature = {
      method: 'PUT',
      url: `/posts/${id}`,
      body: postData,
    };

    return this.deduplicationManager.executeRequest(
      signature,
      () => super.updatePost(id, postData)
    );
  }

  /**
   * Get deduplication statistics
   */
  getDeduplicationStats() {
    return this.deduplicationManager.getStats();
  }

  /**
   * Clear deduplication cache
   */
  clearDeduplicationCache(): void {
    this.deduplicationManager.clearAll();
  }

  /**
   * Reset deduplication statistics
   */
  resetDeduplicationStats(): void {
    this.deduplicationManager.resetStats();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.deduplicationManager.destroy();
  }
}

/**
 * Factory for creating clients with different deduplication strategies
 */
export class DeduplicationFactory {
  /**
   * Create client with aggressive deduplication (30s lifetime)
   */
  static createAggressive(baseURL?: string, config?: any): DeduplicatedJsonPlaceholderClient {
    const client = new DeduplicatedJsonPlaceholderClient(baseURL, config);
    client['deduplicationManager'] = new RequestDeduplicationManager(30000);
    return client;
  }

  /**
   * Create client with moderate deduplication (10s lifetime)
   */
  static createModerate(baseURL?: string, config?: any): DeduplicatedJsonPlaceholderClient {
    const client = new DeduplicatedJsonPlaceholderClient(baseURL, config);
    client['deduplicationManager'] = new RequestDeduplicationManager(10000);
    return client;
  }

  /**
   * Create client with minimal deduplication (5s lifetime)
   */
  static createMinimal(baseURL?: string, config?: any): DeduplicatedJsonPlaceholderClient {
    const client = new DeduplicatedJsonPlaceholderClient(baseURL, config);
    client['deduplicationManager'] = new RequestDeduplicationManager(5000);
    return client;
  }
}
