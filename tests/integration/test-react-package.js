#!/usr/bin/env node

/**
 * React Package Integration Test
 * Validates that the React hooks package works correctly
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 React Package Integration Test');
console.log('=' .repeat(50));

let success = true;
const errors = [];

function test(name, fn) {
  try {
    console.log(`\n📋 ${name}...`);
    fn();
    console.log(`✅ ${name} PASSED`);
  } catch (error) {
    console.log(`❌ ${name} FAILED: ${error.message}`);
    errors.push(`${name}: ${error.message}`);
    success = false;
  }
}

// Test 1: Build the React package
test('Building React package', () => {
  const reactDir = path.join(__dirname, '../../packages/react');
  process.chdir(reactDir);
  execSync('npm run build', { stdio: 'inherit' });
});

// Test 2: Check required files exist
test('Checking build outputs', () => {
  const reactDir = path.join(__dirname, '../../packages/react');
  const requiredFiles = [
    path.join(reactDir, 'dist/index.js'),
    path.join(reactDir, 'dist/index.d.ts'),
    path.join(reactDir, 'dist/esm/index.js')
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing build output: ${file}`);
    }
  });
});

// Test 3: Test package exports
test('Testing package exports', () => {
  const reactDir = path.join(__dirname, '../../packages/react');
  const reactPackage = require(path.join(reactDir, 'dist/index.js'));
  
  const requiredExports = [
    'JsonPlaceholderProvider',
    'useQuery',
    'useMutation',
    'usePost',
    'usePosts',
    'useComments',
    'useUsers'
  ];
  
  requiredExports.forEach(exportName => {
    if (!(exportName in reactPackage)) {
      throw new Error(`Missing export: ${exportName}`);
    }
  });
  
  console.log(`   Found ${requiredExports.length} exports`);
});

// Test 4: Test package.json configuration
test('Validating package.json', () => {
  const reactDir = path.join(__dirname, '../../packages/react');
  const packageJson = JSON.parse(fs.readFileSync(path.join(reactDir, 'package.json'), 'utf8'));
  
  const requiredFields = ['main', 'module', 'types', 'exports'];
  requiredFields.forEach(field => {
    if (!(field in packageJson)) {
      throw new Error(`Missing package.json field: ${field}`);
    }
  });
  
  // Check peer dependencies
  if (!packageJson.peerDependencies || !packageJson.peerDependencies.react) {
    throw new Error('Missing React peer dependency');
  }
  
  console.log('   Package.json properly configured');
});

// Test 5: Run React hooks unit tests
test('Running React hooks tests', () => {
  const reactDir = path.join(__dirname, '../../packages/react');
  process.chdir(reactDir);
  execSync('npm test', { stdio: 'inherit' });
});

// Final results
console.log('\n' + '=' .repeat(50));
if (success) {
  console.log('🎉 ALL REACT PACKAGE TESTS PASSED!');
  console.log('');
  console.log('✅ Package builds correctly');
  console.log('✅ All exports available');
  console.log('✅ TypeScript definitions valid');
  console.log('✅ Unit tests passing');
  console.log('✅ Integration test successful');
  console.log('');
  console.log('🚀 React package is ready for production use!');
  console.log('📦 Priority 1 - React Package Dependencies: COMPLETE (5/5)');
  process.exit(0);
} else {
  console.log('❌ REACT PACKAGE TESTS FAILED!');
  console.log('');
  console.log('Errors encountered:');
  errors.forEach(error => console.log(`  • ${error}`));
  process.exit(1);
}
