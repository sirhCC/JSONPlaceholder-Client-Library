const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function buildTypes() {
  console.log('🔨 Building TypeScript declarations...');
  
  try {
    // Build type declarations
    await execAsync('npx tsc -p tsconfig.types.json', { 
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ TypeScript declarations build complete');
  } catch (error) {
    console.error('❌ TypeScript declarations build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildTypes();
}

module.exports = buildTypes;
