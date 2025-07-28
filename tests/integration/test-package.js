// Test the built package
const path = require('path');
const rootDir = path.join(__dirname, '..', '..');
const { JsonPlaceholderClient } = require(path.join(rootDir, 'dist', 'index.js'));

console.log('Testing CommonJS build...');
const client = new JsonPlaceholderClient();
console.log('✅ CommonJS client created successfully');

// Test that the client has expected methods
console.log('Methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(name => name !== 'constructor'));

console.log('✅ Package build test completed successfully!');
