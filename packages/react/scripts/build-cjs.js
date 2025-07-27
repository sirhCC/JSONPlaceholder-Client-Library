const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function buildCJS() {
  console.log('🔨 Building CommonJS...');
  
  try {
    // Build CommonJS
    await execAsync('npx tsc -p tsconfig.cjs.json', { 
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ CommonJS build complete');
  } catch (error) {
    console.error('❌ CommonJS build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildCJS();
}

module.exports = buildCJS;
