// Test script to verify modular imports work correctly
const path = require('path');

console.log('🧪 Testing Modular Imports...\n');

// Test 1: Core-only import (smallest bundle)
try {
  const core = require('./dist/core');
  console.log('✅ Core import successful');
  console.log('   - Client:', typeof core.JsonPlaceholderClient);
  console.log('   - Has caching?', 'CacheManager' in core ? 'YES' : 'NO');
  console.log('   - Has logging?', 'Logger' in core ? 'YES' : 'NO');
} catch (err) {
  console.log('❌ Core import failed:', err.message);
}

// Test 2: Caching module (includes core + caching)
try {
  const caching = require('./dist/caching');
  console.log('\n✅ Caching import successful');
  console.log('   - Client:', typeof caching.JsonPlaceholderClient);
  console.log('   - CacheManager:', typeof caching.CacheManager);
  console.log('   - MemoryCacheStorage:', typeof caching.MemoryCacheStorage);
} catch (err) {
  console.log('\n❌ Caching import failed:', err.message);
}

// Test 3: Logging module (includes core + logging)
try {
  const logging = require('./dist/logging');
  console.log('\n✅ Logging import successful');
  console.log('   - Client:', typeof logging.JsonPlaceholderClient);
  console.log('   - Logger:', typeof logging.Logger);
  console.log('   - createLogger:', typeof logging.createLogger);
} catch (err) {
  console.log('\n❌ Logging import failed:', err.message);
}

// Test 4: Full library import
try {
  const full = require('./dist/index');
  console.log('\n✅ Full library import successful');
  console.log('   - Client:', typeof full.JsonPlaceholderClient);
  console.log('   - CacheManager:', typeof full.CacheManager);
  console.log('   - Logger:', typeof full.Logger);
} catch (err) {
  console.log('\n❌ Full library import failed:', err.message);
}

console.log('\n📊 Bundle Size Analysis:');
const fs = require('fs');

// Analyze file sizes
const files = [
  { name: 'core.js', path: './dist/core.js' },
  { name: 'caching.js', path: './dist/caching.js' },
  { name: 'logging.js', path: './dist/logging.js' },
  { name: 'index.js (full)', path: './dist/index.js' }
];

files.forEach(file => {
  try {
    const stats = fs.statSync(file.path);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   - ${file.name}: ${sizeKB}KB`);
  } catch (err) {
    console.log(`   - ${file.name}: Not found`);
  }
});

console.log('\n🎯 Usage Examples:');
console.log('   Core only:     import { JsonPlaceholderClient } from "library/core"');
console.log('   With caching:  import { CacheManager } from "library/caching"');
console.log('   With logging:  import { createLogger } from "library/logging"');
console.log('   Full library:  import { JsonPlaceholderClient } from "library"');
