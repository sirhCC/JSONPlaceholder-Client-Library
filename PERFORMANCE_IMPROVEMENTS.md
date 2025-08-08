# Performance Improvement Plan

Last updated: 2025-08-08

Focus: reduce CPU, GC, and main-thread blocking in hot paths (cache hits, key generation, background refresh).

## Implemented

- Throttled browser storage cache metadata writes (metadataWriteIntervalMs, default 30s)
  - Reduces JSON.stringify + setItem on every read; preserves correctness with periodic persistence.

## Next Targets

1. Canonical request keys + lightweight hash

- Goal: stable keys independent of param insertion order; smaller keys.
- Approach:
  - Stable serialize: sort keys, minimal formatting; avoid JSON.stringify for primitives where possible.
  - Hash body when size > N KB (configurable) using fast in-JS hash (djb2/fnv-1a) to avoid giant keys.
- Acceptance:
  - No behavior change; dedup hit rate equal or better; measurable CPU reduction in micro-benchmarks.

1. Cheaper cache size accounting

- Goal: eliminate JSON.stringify(data) in calculateSize for common types.
- Approach:
  - If string: size = 2 * length (UTF-16 guess).
  - If ArrayBuffer/TypedArray: byteLength.
  - If Blob: size property (when available).
  - Else: shallow heuristic; optionally opt-in deep mode.
- Acceptance:
  - Similar size trend; significantly fewer serializations in traces.

1. Incremental cache stats and eviction metadata

- Goal: avoid scanning/parsing all entries in updateStats and eviction.
- Approach:
  - Update currentSize and entryCount on set/delete.
  - Maintain a tiny LRU map {key,lastAccess} to choose eviction candidates without parsing entries.
- Acceptance:
  - updateStats O(1) amortized; eviction O(log n) or O(1) with a heap or linked map.

1. Background refresh smoothing

- Goal: prevent bursts when many entries become refresh-eligible together.
- Approach:
  - Add jitter to refreshThreshold timing; cap concurrent background refreshes; queue excess.
- Acceptance:
  - Smoother network profile; no latency spikes.

1. WebSocket event batching

- Goal: reduce work per event and UI churn.
- Approach:
  - Batch updates during high-frequency bursts; debounce notifications.
- Acceptance:
  - Lower CPU under synthetic bursts; functional tests still pass.

## Benchmark ideas

- Micro: key generation vs JSON.stringify for nested params; large body hashing cutoffs.
- Macro: cached getPosts loop (10k hits) measuring event loop delay with and without metadata throttling.

## Rollout

- Guard new behaviors behind config flags with safe defaults.
- Add docs, changelog entries, and example tunings.
