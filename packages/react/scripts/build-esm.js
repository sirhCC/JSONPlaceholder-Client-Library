const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function buildESM() {
  console.log('🔨 Building ES Modules...');
  
  try {
    // Clean the dist directory
    await fs.rmdir(path.join(__dirname, '..', 'dist'), { recursive: true }).catch(() => {});
    
    // Build ES modules
    await execAsync('npx tsc -p tsconfig.esm.json', { 
      cwd: path.join(__dirname, '..')
    });
    
    // Create package.json for ES modules
    const esmPackageJson = {
      type: 'module'
    };
    
    await fs.writeFile(
      path.join(__dirname, '..', 'dist', 'esm', 'package.json'),
      JSON.stringify(esmPackageJson, null, 2)
    );
    
    console.log('✅ ES Modules build complete');
  } catch (error) {
    console.error('❌ ES Modules build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildESM();
}

module.exports = buildESM;
