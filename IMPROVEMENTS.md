# Improvement Backlog and Priorities

Last updated: 2025-08-08

Use this checklist to track actionable improvements across performance, DX, reliability, and docs. Check items off as they’re completed, and link PRs.

## Top priorities (P0–P1)

- [x] Performance: Canonicalize and hash request-dedup keys
  - Replace JSON.stringify on params/headers with a stable ordered serializer; hash large bodies. Reduces CPU and improves dedup hit rate regardless of param order.
  - Implemented in src/utils/serialization.ts and wired into src/request-deduplication.ts and src/cache.ts.
- [x] Performance: Cheaper cache size estimation
  - Prefer Content-Length header (when available) or lightweight heuristics; avoid JSON.stringify(data) for size in hot paths.
  - Implemented fast, shallow estimator in src/cache.ts (calculateSize), removing JSON.stringify from hot paths.
- [x] Performance: Incremental cache stats
  - Maintain size and entryCount incrementally; avoid scanning all keys and parsing entries during updateStats().
  - Implemented sizeIndex + mismatch-aware resync in src/cache.ts; set/delete/clear update stats without full scans.
- [x] DX/Lint: Align TypeScript and @typescript-eslint versions
  - Eliminate “TS version not supported” warnings; lock compatible versions across root and packages/react.
  - Done: pinned TypeScript 5.5.4 and @typescript-eslint 8.x; ESLint 8.x retained for .eslintrc support. Lint runs without version warnings.
- [ ] DX/Lint: Reduce lint errors via targeted overrides and quick fixes
  - Examples/tests: allow console; prefix unused args with _; relax no-explicit-any for public API generics.
- [x] Docs: Document cache.metadataWriteIntervalMs
  - Added to README and docs/PERFORMANCE.md with examples and tuning guidance.

## Performance (expanded)

- [x] Request key canonicalization and hashing
  - Stable serialize {method,url,params,headers,body?}; hash body > N KB using djb2/xxhash.
  - Done via stableStringify/fastHash in src/utils/serialization.ts; integrated with src/request-deduplication.ts and src/cache.ts.
- [ ] Cache size computation rework
  - Use Content-Length; fallback: if data is string/ArrayBuffer, compute directly; else approximate shallowly.
  - Done: shallow, fast estimator in src/cache.ts (calculateSize) with typed-array/Blob handling.
- [x] Incremental stats and eviction metadata
  - Track currentSize/entryCount on set/delete; store minimal LRU metadata to avoid parsing all entries on eviction.
  - Done: incremental stats in `src/cache.ts` (sizeIndex + resync) and LRU index in `LocalStorageCacheStorage`/`SessionStorageCacheStorage` for fast evictions.
- [ ] Background refresh smoothing
  - Add jitter and max concurrency to background refreshes to prevent thundering herds under SWR.
- [ ] WebSocket event processing budget
  - Batch cache updates and debounce UI notifications to avoid per-message churn.

## Reliability

- [ ] Strengthen local/session storage error handling
  - Handle QUOTA_EXCEEDED gracefully with targeted eviction; surface non-fatal telemetry.
- [ ] Circuit breaker expose state
  - Add read-only getter/events for open/half-open/closed for better observability.
- [ ] Retries with idempotency keys
  - For POST-like operations, optionally add idempotency keys to avoid duplicate effects on retry.

## Developer Experience

- [ ] Monorepo task runner
  - Consider turborepo or npm workspaces scripts with --workspaces for faster multi-package builds/tests.
- [ ] Pre-commit hooks
  - Run lint:fix on changed files; typecheck affected packages.
- [ ] Example sync
  - Ensure examples reference built ESM/CJS correctly; smoke test script.

## Testing

- [ ] Quiet noisy jsdom XHR/WebSocket logs in tests
  - Jest setup to mock WebSocket and suppress expected network warnings.
- [ ] Add benchmarks for cache and dedup
  - Simple micro-benchmarks to guard regressions.

## Documentation

- [ ] README: surface advanced features (SWR, dedup, rate limit, perf)
- [ ] docs/: cross-link Performance and Caching sections; add tuning guide.

---

Owner: @sirhCC  •  Labels: enhancement, performance, dx, reliability
