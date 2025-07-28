# 📦 Bundle Size Optimization Guide

This library is designed with **modular architecture** and **tree-shaking support** to minimize your application's bundle size.

## 🎯 Import Strategies

### 1. **Core Only** (Smallest - ~1.1KB)
Perfect for simple use cases without caching or advanced logging:

```typescript
// ✅ Minimal import - only the client and types
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core';
import type { Post, User } from 'jsonplaceholder-client-lib/core';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  // No caching, silent logging by default
});
```

### 2. **With Caching** (~1.6KB)
Add intelligent caching for better performance:

```typescript
// ✅ Core + Caching features
import { 
  JsonPlaceholderClient,
  CacheManager,
  MemoryCacheStorage 
} from 'jsonplaceholder-client-lib/caching';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  cacheManager: new CacheManager({
    storage: new MemoryCacheStorage(100),
    defaultTTL: 300000
  })
});
```

### 3. **With Logging** (~1.3KB)
Add structured logging for debugging:

```typescript
// ✅ Core + Logging features
import { 
  JsonPlaceholderClient,
  createLogger 
} from 'jsonplaceholder-client-lib/logging';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  loggerConfig: {
    level: 'info',
    enableColors: true
  }
});
```

### 4. **Full Library** (~2.4KB)
All features included:

```typescript
// ✅ Everything included (still lightweight!)
import { 
  JsonPlaceholderClient,
  CacheManager,
  MemoryCacheStorage,
  createLogger
} from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  cacheManager: new CacheManager({
    storage: new MemoryCacheStorage(100),
    defaultTTL: 300000
  }),
  loggerConfig: {
    level: 'debug'
  }
});
```

## 📊 Bundle Size Comparison

| Import Strategy | Bundle Size | Features Included |
|-----------------|-------------|-------------------|
| **Core only** | ~1.1KB | Client + Types + Basic Errors |
| **+ Caching** | ~1.6KB | Core + Cache Manager + Storage Options |
| **+ Logging** | ~1.3KB | Core + Logger + Log Levels |
| **Full Library** | ~2.4KB | All Features |

## 🛠️ Webpack/Vite Configuration

### Enable Tree-Shaking
Ensure your bundler supports tree-shaking:

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};

// vite.config.js
export default {
  build: {
    rollupOptions: {
      treeshake: true
    }
  }
};
```

### Package.json Configuration
```json
{
  "sideEffects": false,
  "type": "module"
}
```

## 🎯 Real-World Examples

### Frontend Framework (React/Vue/Angular)
```typescript
// For most frontend apps - use core + features you need
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/caching';

// Only imports what you use!
```

### Node.js Server
```typescript
// For servers - typically want full logging
import { JsonPlaceholderClient, createLogger } from 'jsonplaceholder-client-lib/logging';
```

### Serverless Functions
```typescript
// For serverless - minimize cold start time
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core';
```

### Mobile Apps (React Native)
```typescript
// For mobile - every KB matters
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core';
```

## 🔍 Bundle Analysis Tools

### Webpack Bundle Analyzer
```bash
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Vite Bundle Analyzer  
```bash
npm run build -- --analyze
```

### Manual Size Check
```bash
# Check individual module sizes
ls -lah node_modules/jsonplaceholder-client-lib/dist/
```

## ⚡ Performance Tips

1. **Use Specific Imports**: Import only what you need
2. **Enable Tree-Shaking**: Configure your bundler properly  
3. **Check Bundle Analysis**: Use tools to verify optimization
4. **Consider Caching**: For apps making repeated API calls
5. **Production Logging**: Use 'silent' or 'error' level in production

## 🚀 Migration Guide

### From Full Imports
```typescript
// ❌ Before (imports everything)
import { JsonPlaceholderClient, CacheManager } from 'jsonplaceholder-client-lib';

// ✅ After (tree-shakeable)
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core';
import { CacheManager } from 'jsonplaceholder-client-lib/caching';
```

### Gradual Adoption
1. Start with core-only imports
2. Add caching if you need performance
3. Add logging if you need debugging
4. Use full import only if you need everything

---

**Result**: Your final bundle will only include the features you actually use, keeping your application fast and lightweight! 🚀
