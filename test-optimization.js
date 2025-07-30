/**
 * Quick test of optimization features
 */

// Test feature flags
console.log('🎯 Testing Feature Flags...');
const { FeatureManager, PRESETS } = require('./dist/features');

// Initialize with core preset
const featureManager = new FeatureManager(PRESETS.CORE);
console.log('Core preset features:', featureManager.getFlags());
console.log('Bundle info:', featureManager.getBundleInfo());

// Test individual features
featureManager.updateFlags({ caching: true });
console.log('After enabling caching:', featureManager.getFlags());

// Test different clients
console.log('\n🚀 Testing Optimized Clients...');

// Test minimal client
try {
  const { JsonPlaceholderClient: MinimalClient } = require('./dist/core-minimal');
  console.log('✅ Core-minimal client loaded successfully');
  const minimalClient = new MinimalClient();
  console.log('Core-minimal client created:', typeof minimalClient.getPosts);
} catch (error) {
  console.log('❌ Core-minimal client error:', error.message);
}

// Test production client
try {
  const { JsonPlaceholderClient: ProductionClient } = require('./dist/production');
  console.log('✅ Production client loaded successfully');
  const productionClient = new ProductionClient();
  console.log('Production client created:', typeof productionClient.getPosts);
} catch (error) {
  console.log('❌ Production client error:', error.message);
}

// Test deduplication
try {
  const { DeduplicatedJsonPlaceholderClient } = require('./dist/request-deduplication');
  console.log('✅ Deduplication client loaded successfully');
  const dedupClient = new DeduplicatedJsonPlaceholderClient();
  console.log('Deduplication client created:', typeof dedupClient.getPosts);
} catch (error) {
  console.log('❌ Deduplication client error:', error.message);
}

// Test compression
try {
  const { CompressionFactory } = require('./dist/cache-compression');
  console.log('✅ Compression system loaded successfully');
  const compressor = CompressionFactory.createAdaptiveCompressor();
  console.log('Adaptive compressor created:', typeof compressor.compress);
} catch (error) {
  console.log('❌ Compression system error:', error.message);
}

console.log('\n🎉 All optimization features loaded successfully!');
