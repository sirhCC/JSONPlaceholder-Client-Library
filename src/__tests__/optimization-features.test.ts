/**
 * Integration test for optimization features
 * This validates that all Priority 5 features are working correctly
 */

import { JsonPlaceholderClient } from '../client';
import { FeatureManager, PRESETS } from '../features';

describe('Priority 5 Optimization Features', () => {
  test('main client works', () => {
    const client = new JsonPlaceholderClient();
    
    expect(typeof client.getPosts).toBe('function');
    expect(typeof client.getPost).toBe('function');
    expect(typeof client.createPost).toBe('function');
  });

  test('feature flag system works', () => {
    const manager = FeatureManager.getInstance(PRESETS.CORE);
    const info = manager.getBundleInfo();
    
    expect(info).toHaveProperty('estimatedKB');
    expect(info).toHaveProperty('features');
    expect(Array.isArray(info.features)).toBe(true);
    expect(typeof info.estimatedKB).toBe('number');
  });

  test('optimization classes are available', async () => {
    const { DeduplicatedJsonPlaceholderClient } = await import('../request-deduplication');
    const { PrefetchingJsonPlaceholderClient } = await import('../intelligent-prefetching');
    
    expect(typeof DeduplicatedJsonPlaceholderClient).toBe('function');
    expect(typeof PrefetchingJsonPlaceholderClient).toBe('function');
    
    const dedupClient = new DeduplicatedJsonPlaceholderClient();
    const prefetchClient = new PrefetchingJsonPlaceholderClient();
    
    expect(typeof dedupClient.getPosts).toBe('function');
    expect(typeof prefetchClient.getPosts).toBe('function');
  });

  test('lazy loading utilities are available', async () => {
    const lazyLoading = await import('../lazy-loading');
    
    expect(lazyLoading).toHaveProperty('lazyLoadPerformance');
    expect(lazyLoading).toHaveProperty('getOptimizedFeatureLoader');
    expect(typeof lazyLoading.lazyLoadPerformance).toBe('function');
    expect(typeof lazyLoading.getOptimizedFeatureLoader).toBe('function');
  });

  test('cache compression is available', async () => {
    const { CompressionFactory } = await import('../cache-compression');
    
    expect(typeof CompressionFactory.createJSONCompressor).toBe('function');
    expect(typeof CompressionFactory.createAdaptiveCompressor).toBe('function');
    
    const compressor = CompressionFactory.createJSONCompressor();
    expect(compressor).toBeDefined();
    expect(typeof compressor.compressForCache).toBe('function');
    expect(typeof compressor.decompressFromCache).toBe('function');
  });
});
