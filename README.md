# JSONPlaceholder Client Library

![CI](https://github.com/sirhCC/JSONPlaceholder-Client-Library/actions/workflows/ci.yml/badge.svg)
<!-- Optionally add coverage badge after first CI run with coverage reporting service -->

High‑performance TypeScript client for JSONPlaceholder with smart caching, request deduplication, robust security, and great DX. Ships ESM/CJS builds and React hooks.

- Docs: ./docs/README.md
- Examples: ./examples/README.md
- React Hooks: ./packages/react/README.md

---

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Features](#features)
- [Performance](#performance)
- [Security & Reliability](#security--reliability)
- [React Hooks](#react-hooks)
- [Advanced Guides](#advanced-guides)
- [Examples](#examples)
- [Contributing & Testing](#contributing--testing)
- [License](#license)

---

## Quick Start

### Installation

```bash
npm install jsonplaceholder-client-lib
# or
yarn add jsonplaceholder-client-lib
# or
pnpm add jsonplaceholder-client-lib
```

### Basic Usage

```ts
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com');

// Fetch a post
const post = await client.getPost(1);
console.log(post.title);

// With caching
const posts = await client.getPosts({ cache: true });
```

---

## Configuration

The client supports layered configuration (cache, logging, performance):

```ts
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  cache: {
    enabled: true,
    storage: 'localStorage', // 'memory' | 'localStorage' | 'sessionStorage'
    defaultTTL: 5 * 60_000,
    refreshThreshold: 0.8,
    metadataWriteIntervalMs: 30_000 // throttle metadata write-backs
  },
  logger: { level: 'info' },
  performance: { enabled: true }
});
```

Key cache knobs:

- defaultTTL: item time-to-live in ms
- refreshThreshold: stale-while-revalidate trigger (0–1)
- metadataWriteIntervalMs: throttle access metadata writes for browser storage to reduce main‑thread blocking

---

## Features

- Smart caching (memory, localStorage, sessionStorage)
- Request deduplication (identical in-flight requests collapse)
- Background refresh (stale-while-revalidate)
- Performance monitoring hooks
- Structured logging with levels
- Strong typing and DX

See more in docs/.

---

## Performance

Highlights:

- Canonicalized request/cache keys with stable serialization and hashing for large bodies
- Throttled browser storage metadata writes (metadataWriteIntervalMs)
- Incremental cache stats with fast resync
- Cheaper, shallow cache size estimation

Example:

```ts
// Deduped identical requests
const [a, b] = await Promise.all([client.getPosts(), client.getPosts()]);
// Only one network request is executed
```

For detailed optimization tips, see docs/PERFORMANCE.md.

---

## Security & Reliability

- Memory security utilities for handling sensitive data (auto-cleanup, safe cloning)
- TLS configuration helpers
- Circuit breaker, retries, and error handling patterns

Refer to:

- docs/SECURITY.md
- docs/ERROR_HANDLING.md

---

## React Hooks

Use the React package for idiomatic data fetching with caching:

- JsonPlaceholderProvider to share a client via context
- useQuery and useMutation style hooks

See packages/react/README.md.

---

## Advanced Guides

- docs/BUNDLE_OPTIMIZATION.md
- docs/PERFORMANCE.md
- docs/PUBLISHING.md
- docs/TROUBLESHOOTING.md

---

## Examples

Explore runnable examples in examples/:

- basic-usage.js
- caching and SWR
- request deduplication
- performance monitoring
- websocket realtime fallback

---

## Contributing & Testing

We welcome contributions. Please see docs/CONTRIBUTING.md.

Run tests:

```bash
npm test
```

---

## License

MIT

