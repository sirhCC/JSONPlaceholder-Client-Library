/**
 * Lazy loading utilities for heavy optional features
 * This allows features to be loaded only when needed, reducing initial bundle size
 */

import { FeatureManager } from './features';

// Lazy loading promises to ensure single loading
const lazyLoadPromises = new Map<string, Promise<unknown>>();

/**
 * Lazy loader for performance monitoring
 * Only loads when performance features are needed
 */
export const lazyLoadPerformance = async () => {
  const key = 'performance';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./performance'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Lazy loader for developer tools
 * Only loads in development mode or when explicitly requested
 */
export const lazyLoadDeveloperTools = async () => {
  const key = 'developer-tools';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./developer-tools'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Lazy loader for validation system
 * Only loads when validation is needed
 */
export const lazyLoadValidation = async () => {
  const key = 'validation';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./validation'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Lazy loader for rate limiting
 * Only loads when rate limiting is configured
 */
export const lazyLoadRateLimiting = async () => {
  const key = 'rate-limiting';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./rate-limiter'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Lazy loader for error recovery features
 * Only loads when error recovery is needed
 */
export const lazyLoadErrorRecovery = async () => {
  const key = 'error-recovery';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./error-recovery'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Lazy loader for security features
 * Only loads when security features are enabled
 */
export const lazyLoadSecurity = async () => {
  const key = 'security';
  
  if (!lazyLoadPromises.has(key)) {
    lazyLoadPromises.set(key, import('./sanitization'));
  }
  
  return lazyLoadPromises.get(key);
};

/**
 * Generic lazy feature loader with caching
 */
export class LazyFeatureLoader {
  private static loadedFeatures = new Set<string>();
  private static featureCache = new Map<string, unknown>();

  /**
   * Load a feature only if it's enabled and not already loaded
   */
  static async loadIfEnabled<T>(
    featureName: keyof import('./features').FeatureFlags,
    loader: () => Promise<T>
  ): Promise<T | null> {
    const featureManager = FeatureManager.getInstance();
    
    if (!featureManager.isEnabled(featureName)) {
      return null;
    }

    const cacheKey = featureName;
    
    if (this.featureCache.has(cacheKey)) {
      return this.featureCache.get(cacheKey) as T;
    }

    const feature = await loader();
    this.featureCache.set(cacheKey, feature);
    this.loadedFeatures.add(featureName);
    
    return feature;
  }

  /**
   * Get list of currently loaded features
   */
  static getLoadedFeatures(): string[] {
    return Array.from(this.loadedFeatures);
  }

  /**
   * Clear feature cache (useful for testing)
   */
  static clearCache(): void {
    this.featureCache.clear();
    this.loadedFeatures.clear();
  }

  /**
   * Preload critical features based on configuration
   */
  static async preloadCriticalFeatures(): Promise<void> {
    const featureManager = FeatureManager.getInstance();
    const flags = featureManager.getFlags();

    // Preload only the most commonly used features
    const preloadPromises: Promise<unknown>[] = [];

    if (flags.caching) {
      preloadPromises.push(import('./cache'));
    }

    if (flags.logging) {
      preloadPromises.push(import('./logger'));
    }

    // Wait for critical features to load
    await Promise.all(preloadPromises);
  }
}

/**
 * Development-only lazy loader
 * Only loads in development mode
 */
export const lazyLoadDevFeatures = async () => {
  if (process.env.NODE_ENV === 'development') {
    const [devTools, performanceDemo] = await Promise.all([
      lazyLoadDeveloperTools(),
      import('./developer-experience-demo')
    ]);
    
    return { devTools, performanceDemo };
  }
  
  return null;
};

/**
 * Production optimizations
 * Removes development features at build time
 */
export const getOptimizedFeatureLoader = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, return minimal loader that excludes dev features
    return {
      loadPerformance: lazyLoadPerformance,
      loadValidation: lazyLoadValidation,
      loadRateLimiting: lazyLoadRateLimiting,
      loadErrorRecovery: lazyLoadErrorRecovery,
      loadSecurity: lazyLoadSecurity,
      loadDeveloperTools: () => Promise.resolve(null), // No-op in production
    };
  }

  // In development, return full loader
  return {
    loadPerformance: lazyLoadPerformance,
    loadValidation: lazyLoadValidation,
    loadRateLimiting: lazyLoadRateLimiting,
    loadErrorRecovery: lazyLoadErrorRecovery,
    loadSecurity: lazyLoadSecurity,
    loadDeveloperTools: lazyLoadDeveloperTools,
  };
};
