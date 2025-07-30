/**
 * Feature flags for granular tree-shaking and bundle optimization
 * This allows users to import only the features they need
 */

// Feature flag configuration
export interface FeatureFlags {
  caching?: boolean;
  performance?: boolean;
  logging?: boolean;
  security?: boolean;
  validation?: boolean;
  rateLimiting?: boolean;
  errorRecovery?: boolean;
  developerTools?: boolean;
}

// Default feature configuration for full-featured build
export const DEFAULT_FEATURES: Required<FeatureFlags> = {
  caching: true,
  performance: true,
  logging: true,
  security: true,
  validation: true,
  rateLimiting: true,
  errorRecovery: true,
  developerTools: true,
};

// Lightweight core features only
export const CORE_FEATURES: FeatureFlags = {
  caching: false,
  performance: false,
  logging: true,  // Keep basic logging
  security: false,
  validation: false,
  rateLimiting: false,
  errorRecovery: false,
  developerTools: false,
};

// Production-optimized features (excludes dev tools)
export const PRODUCTION_FEATURES: FeatureFlags = {
  caching: true,
  performance: true,
  logging: true,
  security: true,
  validation: true,
  rateLimiting: true,
  errorRecovery: true,
  developerTools: false, // Exclude dev tools in production
};

/**
 * Feature detection utilities
 */
export class FeatureDetector {
  static isFeatureEnabled(feature: keyof FeatureFlags, flags: FeatureFlags = DEFAULT_FEATURES): boolean {
    return flags[feature] ?? false;
  }

  static getEnabledFeatures(flags: FeatureFlags): Array<keyof FeatureFlags> {
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature as keyof FeatureFlags);
  }

  static getBundleSize(flags: FeatureFlags): { estimatedKB: number; features: string[] } {
    const baseSizeKB = 15; // Core client + types + basic logging
    const featureSizes: Record<keyof FeatureFlags, number> = {
      caching: 20,        // cache.js
      performance: 19,    // performance.js
      logging: 2,         // Additional logging features
      security: 6,        // sanitization.js
      validation: 20,     // validation.js
      rateLimiting: 15,   // rate-limiter.js
      errorRecovery: 19,  // error-recovery.js
      developerTools: 25, // developer-tools.js + developer-experience-demo.js
    };

    const enabledFeatures = this.getEnabledFeatures(flags);
    const totalSize = baseSizeKB + enabledFeatures.reduce((size, feature) => {
      return size + (featureSizes[feature] || 0);
    }, 0);

    return {
      estimatedKB: totalSize,
      features: enabledFeatures
    };
  }
}

/**
 * Runtime feature flag management
 */
export class FeatureManager {
  private static instance: FeatureManager;
  private flags: FeatureFlags;

  private constructor(flags: FeatureFlags = DEFAULT_FEATURES) {
    this.flags = flags;
  }

  static getInstance(flags?: FeatureFlags): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager(flags);
    }
    return FeatureManager.instance;
  }

  isEnabled(feature: keyof FeatureFlags): boolean {
    return FeatureDetector.isFeatureEnabled(feature, this.flags);
  }

  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  getBundleInfo(): { estimatedKB: number; features: string[] } {
    return FeatureDetector.getBundleSize(this.flags);
  }
}

// Export preset configurations for easy consumption
export const PRESETS = {
  FULL: DEFAULT_FEATURES,
  CORE: CORE_FEATURES,
  PRODUCTION: PRODUCTION_FEATURES,
} as const;
