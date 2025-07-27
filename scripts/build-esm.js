const fs = require('fs');
const path = require('path');

// Read all .js files in dist and rename them to .esm.js for ESM build
function renameJsFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      renameJsFiles(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.esm.js')) {
      const newPath = path.join(dir, file.replace('.js', '.esm.js'));
      fs.renameSync(filePath, newPath);
    }
  });
}

// Only run if this is the ESM build
if (process.env.BUILD_TYPE === 'esm') {
  renameJsFiles('./dist');
}
