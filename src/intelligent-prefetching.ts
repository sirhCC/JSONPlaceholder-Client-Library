/**
 * Intelligent prefetching system with usage pattern analysis
 * Learns from user behavior to predict and prefetch likely needed data
 */

import { JsonPlaceholderClient } from './client';
import type { Post, User, CacheOptions } from './types';

/**
 * Usage pattern tracking
 */
interface UsagePattern {
  resource: string;
  accessCount: number;
  lastAccessed: number;
  averageTimeToNext: number;
  frequentlyAccessedWith: Map<string, number>;
  timeOfDayPattern: number[]; // 24 hour pattern
  dayOfWeekPattern: number[]; // 7 day pattern
}

/**
 * Prefetch prediction
 */
interface PrefetchPrediction {
  resource: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  estimatedAccessTime: number;
  reason: string;
}

/**
 * Prefetching configuration
 */
interface PrefetchConfig {
  enabled: boolean;
  maxConcurrentPrefetches: number;
  minConfidenceThreshold: number;
  prefetchTimeWindow: number; // milliseconds
  learningEnabled: boolean;
  aggressiveMode: boolean;
}

/**
 * Prefetch statistics
 */
interface PrefetchStats {
  totalPrefetches: number;
  successfulPrefetches: number;
  wastedPrefetches: number;
  cacheHitsFromPrefetch: number;
  bandwidthSaved: number;
  averageLoadTimeReduction: number;
}

/**
 * Intelligent prefetching manager
 */
export class IntelligentPrefetchManager {
  private client: JsonPlaceholderClient;
  private usagePatterns = new Map<string, UsagePattern>();
  private config: PrefetchConfig = {
    enabled: true,
    maxConcurrentPrefetches: 3,
    minConfidenceThreshold: 0.7,
    prefetchTimeWindow: 30000,
    learningEnabled: true,
    aggressiveMode: false,
  };
  private stats: PrefetchStats = {
    totalPrefetches: 0,
    successfulPrefetches: 0,
    wastedPrefetches: 0,
    cacheHitsFromPrefetch: 0,
    bandwidthSaved: 0,
    averageLoadTimeReduction: 0,
  };
  private activePrefetches = new Set<string>();
  private prefetchedResources = new Map<string, { data: unknown; timestamp: number }>();

  constructor(client: JsonPlaceholderClient, config?: Partial<PrefetchConfig>) {
    this.client = client;
    this.config = { ...this.config, ...config };
  }

  /**
   * Record resource access for pattern learning
   */
  recordAccess(resource: string, context?: string[]): void {
    if (!this.config.learningEnabled) return;

    const now = Date.now();
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    let pattern = this.usagePatterns.get(resource);
    if (!pattern) {
      pattern = {
        resource,
        accessCount: 0,
        lastAccessed: 0,
        averageTimeToNext: 0,
        frequentlyAccessedWith: new Map(),
        timeOfDayPattern: new Array(24).fill(0),
        dayOfWeekPattern: new Array(7).fill(0),
      };
      this.usagePatterns.set(resource, pattern);
    }

    // Update access count and timing
    pattern.accessCount++;
    if (pattern.lastAccessed > 0) {
      const timeSinceLastAccess = now - pattern.lastAccessed;
      pattern.averageTimeToNext = 
        (pattern.averageTimeToNext * (pattern.accessCount - 1) + timeSinceLastAccess) / pattern.accessCount;
    }
    pattern.lastAccessed = now;

    // Update time patterns
    pattern.timeOfDayPattern[currentHour]++;
    pattern.dayOfWeekPattern[currentDay]++;

    // Update co-access patterns
    if (context) {
      context.forEach(relatedResource => {
        if (relatedResource !== resource) {
          const currentCount = pattern!.frequentlyAccessedWith.get(relatedResource) || 0;
          pattern!.frequentlyAccessedWith.set(relatedResource, currentCount + 1);
        }
      });
    }

    // Trigger prefetch predictions
    this.triggerPrefetchAnalysis(resource);
  }

  /**
   * Analyze patterns and trigger prefetches
   */
  private async triggerPrefetchAnalysis(triggeredBy: string): Promise<void> {
    if (!this.config.enabled) return;

    const predictions = this.generatePrefetchPredictions(triggeredBy);
    const highConfidencePredictions = predictions
      .filter(p => p.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxConcurrentPrefetches);

    // Execute prefetches
    for (const prediction of highConfidencePredictions) {
      if (!this.activePrefetches.has(prediction.resource)) {
        this.executePrefetch(prediction);
      }
    }
  }

  /**
   * Generate prefetch predictions based on patterns
   */
  private generatePrefetchPredictions(triggeredBy: string): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    const triggerPattern = this.usagePatterns.get(triggeredBy);

    if (!triggerPattern) return predictions;

    // Predict based on co-access patterns
    triggerPattern.frequentlyAccessedWith.forEach((count, resource) => {
      const coAccessRate = count / triggerPattern.accessCount;
      if (coAccessRate > 0.3) { // 30% co-access rate
        predictions.push({
          resource,
          confidence: Math.min(coAccessRate, 0.95),
          priority: coAccessRate > 0.7 ? 'high' : coAccessRate > 0.5 ? 'medium' : 'low',
          estimatedAccessTime: Date.now() + 5000, // 5 seconds
          reason: `Often accessed with ${triggeredBy} (${(coAccessRate * 100).toFixed(1)}% of the time)`,
        });
      }
    });

    // Predict based on temporal patterns
    const currentHour = new Date().getHours();
    const _currentDay = new Date().getDay();

    this.usagePatterns.forEach((pattern, resource) => {
      if (resource === triggeredBy) return;

      // Check time-of-day pattern
      const hourlyAccess = pattern.timeOfDayPattern[currentHour];
      const totalAccess = pattern.accessCount;
      const hourlyRate = hourlyAccess / totalAccess;

      if (hourlyRate > 0.1 && pattern.accessCount > 5) { // 10% access rate in this hour
        const confidence = Math.min(hourlyRate * 2, 0.8); // Cap at 80%
        predictions.push({
          resource,
          confidence,
          priority: confidence > 0.6 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
          estimatedAccessTime: Date.now() + pattern.averageTimeToNext,
          reason: `High usage probability at ${currentHour}:00 (${(hourlyRate * 100).toFixed(1)}%)`,
        });
      }
    });

    // Predict based on sequence patterns
    this.addSequencePredictions(predictions, triggeredBy);

    return predictions;
  }

  /**
   * Add predictions based on access sequences
   */
  private addSequencePredictions(predictions: PrefetchPrediction[], triggeredBy: string): void {
    // Simple sequence prediction: if user accesses post X, they might access post X+1, X-1
    const postMatch = triggeredBy.match(/^\/posts\/(\d+)$/);
    if (postMatch) {
      const currentPostId = parseInt(postMatch[1]);
      
      // Predict next and previous post
      [`/posts/${currentPostId + 1}`, `/posts/${currentPostId - 1}`].forEach(resource => {
        if (currentPostId > 1 || resource.includes(`${currentPostId + 1}`)) {
          predictions.push({
            resource,
            confidence: 0.4,
            priority: 'low',
            estimatedAccessTime: Date.now() + 10000,
            reason: 'Sequential post access pattern',
          });
        }
      });
    }

    // User access pattern: if accessing user posts, might access user details
    const userPostsMatch = triggeredBy.match(/^\/posts\?userId=(\d+)$/);
    if (userPostsMatch) {
      const userId = userPostsMatch[1];
      predictions.push({
        resource: `/users/${userId}`,
        confidence: 0.6,
        priority: 'medium',
        estimatedAccessTime: Date.now() + 3000,
        reason: 'User details often accessed after user posts',
      });
    }
  }

  /**
   * Execute a prefetch operation
   */
  private async executePrefetch(prediction: PrefetchPrediction): Promise<void> {
    if (this.activePrefetches.has(prediction.resource)) return;

    this.activePrefetches.add(prediction.resource);
    this.stats.totalPrefetches++;

    try {
      const startTime = Date.now();
      let data: unknown;

      // Route to appropriate client method based on resource pattern
      if (prediction.resource.startsWith('/posts/')) {
        const postId = parseInt(prediction.resource.split('/')[2]);
        data = await this.client.getPost(postId);
      } else if (prediction.resource.startsWith('/users/')) {
        const userId = parseInt(prediction.resource.split('/')[2]);
        data = await this.client.getUser(userId);
      } else if (prediction.resource.includes('userId=')) {
        const userId = prediction.resource.match(/userId=(\d+)/)?.[1];
        if (userId) {
          data = await this.client.getPostsByUser(parseInt(userId));
        }
      } else {
        // Default to generic request
        data = null;
      }

      const _loadTime = Date.now() - startTime;
      
      if (data) {
        this.prefetchedResources.set(prediction.resource, {
          data,
          timestamp: Date.now(),
        });
        this.stats.successfulPrefetches++;
        
        // Clean up old prefetched data
        this.cleanupExpiredPrefetches();
      }

    } catch (error) {
      this.stats.wastedPrefetches++;
    } finally {
      this.activePrefetches.delete(prediction.resource);
    }
  }

  /**
   * Check if resource is available from prefetch
   */
  getPrefetchedResource(resource: string): unknown | null {
    const cached = this.prefetchedResources.get(resource);
    if (cached && Date.now() - cached.timestamp < this.config.prefetchTimeWindow) {
      this.stats.cacheHitsFromPrefetch++;
      return cached.data;
    }
    return null;
  }

  /**
   * Clean up expired prefetched resources
   */
  private cleanupExpiredPrefetches(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.prefetchedResources.forEach((cached, resource) => {
      if (now - cached.timestamp > this.config.prefetchTimeWindow) {
        expired.push(resource);
      }
    });

    expired.forEach(resource => {
      this.prefetchedResources.delete(resource);
    });
  }

  /**
   * Get prefetch statistics and insights
   */
  getStats(): PrefetchStats & { insights: string[] } {
    const insights: string[] = [];
    
    const hitRate = this.stats.totalPrefetches > 0 
      ? (this.stats.successfulPrefetches / this.stats.totalPrefetches) * 100 
      : 0;
    
    insights.push(`Prefetch success rate: ${hitRate.toFixed(1)}%`);
    
    if (this.stats.cacheHitsFromPrefetch > 0) {
      insights.push(`${this.stats.cacheHitsFromPrefetch} requests served from prefetch cache`);
    }
    
    const topPatterns = Array.from(this.usagePatterns.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 3)
      .map(([resource, pattern]) => `${resource} (${pattern.accessCount} accesses)`);
    
    if (topPatterns.length > 0) {
      insights.push(`Top resources: ${topPatterns.join(', ')}`);
    }

    return {
      ...this.stats,
      insights,
    };
  }

  /**
   * Update prefetch configuration
   */
  updateConfig(newConfig: Partial<PrefetchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all learned patterns
   */
  clearPatterns(): void {
    this.usagePatterns.clear();
    this.prefetchedResources.clear();
  }

  /**
   * Export learned patterns for analysis
   */
  exportPatterns(): Record<string, unknown> {
    const patterns: Record<string, unknown> = {};
    
    this.usagePatterns.forEach((pattern, resource) => {
      patterns[resource] = {
        accessCount: pattern.accessCount,
        averageTimeToNext: pattern.averageTimeToNext,
        peakHour: pattern.timeOfDayPattern.indexOf(Math.max(...pattern.timeOfDayPattern)),
        topCoAccesses: Array.from(pattern.frequentlyAccessedWith.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3),
      };
    });

    return patterns;
  }
}

/**
 * Client wrapper with intelligent prefetching
 */
export class PrefetchingJsonPlaceholderClient extends JsonPlaceholderClient {
  private prefetchManager: IntelligentPrefetchManager;

  constructor(baseURL?: string, config?: unknown, prefetchConfig?: Partial<PrefetchConfig>) {
    super(baseURL, config as never);
    this.prefetchManager = new IntelligentPrefetchManager(this as JsonPlaceholderClient, prefetchConfig);
  }

  /**
   * Enhanced getPost with prefetching
   */
  async getPost(id: number, cacheOptions?: CacheOptions): Promise<Post> {
    const resource = `/posts/${id}`;
    
    // Check prefetch cache first
    const prefetched = this.prefetchManager.getPrefetchedResource(resource);
    if (prefetched) {
      this.prefetchManager.recordAccess(resource);
      return prefetched as Post;
    }

    // Normal request with pattern recording
    const result = await super.getPost(id, cacheOptions);
    this.prefetchManager.recordAccess(resource);
    return result;
  }

  /**
   * Enhanced getUser with prefetching
   */
  async getUser(id: number, cacheOptions?: CacheOptions): Promise<User> {
    const resource = `/users/${id}`;
    
    const prefetched = this.prefetchManager.getPrefetchedResource(resource);
    if (prefetched) {
      this.prefetchManager.recordAccess(resource);
      return prefetched as User;
    }

    const result = await super.getUser(id, cacheOptions);
    this.prefetchManager.recordAccess(resource);
    return result;
  }

  /**
   * Get prefetching statistics
   */
  getPrefetchStats() {
    return this.prefetchManager.getStats();
  }

  /**
   * Export learned usage patterns
   */
  exportUsagePatterns() {
    return this.prefetchManager.exportPatterns();
  }

  /**
   * Configure prefetching behavior
   */
  configurePrefetching(config: Partial<PrefetchConfig>): void {
    this.prefetchManager.updateConfig(config);
  }
}
