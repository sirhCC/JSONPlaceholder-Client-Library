# JSONPlaceholder Client Library - AI Coding Instructions

## Project Architecture

This is a **modular TypeScript library** for the JSONPlaceholder API with a **monorepo structure**:
- **Main package**: Core client (`src/`) with tree-shakeable exports
- **React package**: React hooks (`packages/react/`) as separate npm package
- **Multi-format builds**: CommonJS, ESM, and TypeScript declarations

## Key Design Patterns

### Modular Export Strategy
The library uses **strategic index.ts files** for tree-shaking:
- `src/index.ts`: Full-featured exports (caching, logging, performance)
- `src/core.ts`: Lightweight core-only exports
- Consumers import specific modules: `import { Logger } from 'jsonplaceholder-client-lib/logging'`

### Caching Architecture
**Three-tier caching system** in `src/cache.ts`:
- **Storage adapters**: `MemoryCacheStorage`, `LocalStorageCacheStorage`, `SessionStorageCacheStorage`
- **Background refresh**: Stale-while-revalidate pattern with `refreshThreshold`
- **Event system**: Cache events for monitoring and debugging

### Client Configuration Pattern
```typescript
// src/client.ts - Layered configuration approach
const client = new JsonPlaceholderClient(baseURL, {
  cache: { enabled: true, storage: 'localStorage' },
  logger: { level: 'info' },
  performance: { enabled: true }
});
```

### React Integration
React hooks in `packages/react/src/` follow **data-fetching patterns**:
- `useQuery` for data fetching with caching
- `useMutation` for data modifications
- Context provider for client sharing: `JsonPlaceholderProvider`

## Build & Development Workflows

### Multi-Target Builds
```bash
# Build all formats (CJS + ESM + types)
npm run build
# Individual builds
npm run build:cjs    # CommonJS for Node.js
npm run build:esm    # ES modules for bundlers
```

### Workspace Commands
```bash
# Test core + React packages
npm test
npm run test:integration  # Package validation tests
npm run test:validate     # Cross-package compatibility

# Development servers
npm run demo:server       # Demo server for examples
```

### TypeScript Configuration
**Multiple tsconfig files** for different output formats:
- `tsconfig.json`: Base configuration
- `tsconfig.cjs.json`: CommonJS build
- `tsconfig.esm.json`: ES modules build

## Testing Strategy

### Test Structure
- **Unit tests**: `src/__tests__/` - Core functionality
- **Integration tests**: `tests/integration/` - Package validation
- **React tests**: `packages/react/src/__tests__/` - Hook testing with React Testing Library

### Mock Patterns
Tests use **axios mocking** and **fake timers** for:
- Cache TTL testing
- Network error simulation
- Performance monitoring validation

## Project-Specific Conventions

### Error Handling
**Custom error hierarchy** in `src/types.ts`:
```typescript
PostNotFoundError, ValidationError, ServerError, RateLimitError
```
All extend `ApiClientError` with structured error context.

### Performance Monitoring
`src/performance.ts` provides **built-in metrics**:
- Request timing, cache hit rates, error tracking
- Dashboard utilities for debugging
- Event listeners for custom monitoring

### Logging System
**Configurable logging** with `src/logger.ts`:
- Five levels: `silent`, `error`, `warn`, `info`, `debug`
- Production-safe with `SilentLogger` default
- Structured output with timestamps and prefixes

## Integration Points

### External Dependencies
- **Axios**: HTTP client (only prod dependency)
- **React** (peer): For hooks package only
- **Jest + React Testing Library**: Testing stack

### Package Relationships
- Main package exports core client
- React package **imports and extends** main package
- Shared TypeScript types across packages
- Independent versioning and publishing

## Critical Files for Understanding
- `src/client.ts`: Main client implementation with all features
- `src/index.ts` vs `src/core.ts`: Export strategy examples
- `packages/react/src/hooks.ts`: React patterns and caching integration
- `examples/`: Real-world usage patterns and configurations
