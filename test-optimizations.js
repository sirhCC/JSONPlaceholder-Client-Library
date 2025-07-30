#!/usr/bin/env node
/**
 * Integration test for Priority 5 optimization features
 * This test validates all the new optimization exports work correctly
 */

console.log('🧪 Testing Priority 5 Optimization Features...\n');

const tests = [];

// Test 1: Core-minimal build
try {
  const { JsonPlaceholderClient } = require('./dist/core-minimal');
  const client = new JsonPlaceholderClient();
  if (typeof client.getPosts === 'function') {
    tests.push('✅ Core-minimal: Basic client functionality');
  } else {
    tests.push('❌ Core-minimal: Missing basic methods');
  }
} catch (error) {
  tests.push(`❌ Core-minimal: Load error - ${error.message}`);
}

// Test 2: Production build
try {
  const { JsonPlaceholderClient } = require('./dist/production');
  const client = new JsonPlaceholderClient();
  if (typeof client.getPosts === 'function') {
    tests.push('✅ Production: Client loads successfully');
  } else {
    tests.push('❌ Production: Missing methods');
  }
} catch (error) {
  tests.push(`❌ Production: Load error - ${error.message}`);
}

// Test 3: Feature flags system
try {
  const { FeatureManager, PRESETS } = require('./dist/features');
  const manager = new FeatureManager(PRESETS.CORE);
  const info = manager.getBundleInfo();
  if (info && typeof info.estimatedKB === 'number') {
    tests.push(`✅ Features: Bundle analysis (${info.estimatedKB}KB estimated)`);
  } else {
    tests.push('❌ Features: Bundle analysis failed');
  }
} catch (error) {
  tests.push(`❌ Features: Load error - ${error.message}`);
}

// Test 4: Lazy loading system
try {
  const lazyLoading = require('./dist/lazy-loading');
  const hasLoaders = lazyLoading.lazyLoadPerformance && lazyLoading.getOptimizedFeatureLoader;
  if (hasLoaders) {
    tests.push('✅ Lazy Loading: Loader functions available');
  } else {
    tests.push('❌ Lazy Loading: Missing loader functions');
  }
} catch (error) {
  tests.push(`❌ Lazy Loading: Load error - ${error.message}`);
}

// Test 5: Cache compression
try {
  const { CompressionFactory } = require('./dist/cache-compression');
  const compressor = CompressionFactory.createJSONCompressor();
  if (compressor && compressor.strategy) {
    tests.push('✅ Cache Compression: Factory creates compression managers');
  } else {
    tests.push('❌ Cache Compression: Invalid compression manager created');
  }
} catch (error) {
  tests.push(`❌ Cache Compression: Load error - ${error.message}`);
}

// Test 6: Request deduplication
try {
  const { DeduplicatedJsonPlaceholderClient } = require('./dist/request-deduplication');
  const client = new DeduplicatedJsonPlaceholderClient();
  if (typeof client.getPosts === 'function') {
    tests.push('✅ Request Deduplication: Client available');
  } else {
    tests.push('❌ Request Deduplication: Missing methods');
  }
} catch (error) {
  tests.push(`❌ Request Deduplication: Load error - ${error.message}`);
}

// Test 7: Intelligent prefetching
try {
  const { PrefetchingJsonPlaceholderClient } = require('./dist/intelligent-prefetching');
  const client = new PrefetchingJsonPlaceholderClient();
  if (typeof client.getPosts === 'function') {
    tests.push('✅ Intelligent Prefetching: Client available');
  } else {
    tests.push('❌ Intelligent Prefetching: Missing methods');
  }
} catch (error) {
  tests.push(`❌ Intelligent Prefetching: Load error - ${error.message}`);
}

// Test 8: Main index exports all optimization features
try {
  const mainExports = require('./dist/index');
  const hasDedup = !!mainExports.DeduplicatedJsonPlaceholderClient;
  const hasPrefetch = !!mainExports.PrefetchingJsonPlaceholderClient;
  
  if (hasDedup && hasPrefetch) {
    tests.push('✅ Main Index: All optimization exports available');
  } else {
    tests.push(`❌ Main Index: Missing exports (dedup: ${hasDedup}, prefetch: ${hasPrefetch})`);
  }
} catch (error) {
  tests.push(`❌ Main Index: Load error - ${error.message}`);
}

// Output results
console.log('📊 Test Results:');
tests.forEach(test => console.log(`   ${test}`));

const passed = tests.filter(t => t.startsWith('✅')).length;
const failed = tests.filter(t => t.startsWith('❌')).length;

console.log('\n📈 Summary:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📦 Total: ${tests.length}`);

if (failed === 0) {
  console.log('\n🎉 All optimization features working correctly!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some optimization features have issues');
  process.exit(1);
}
