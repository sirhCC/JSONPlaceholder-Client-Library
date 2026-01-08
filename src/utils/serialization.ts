/*
 * Stable serialization and lightweight hashing utilities for key generation.
 */

import { SECURITY_CONSTANTS } from '../constants';

const LARGE_VALUE_HASH_THRESHOLD = SECURITY_CONSTANTS.LARGE_VALUE_HASH_THRESHOLD;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function isArrayBufferView(x: unknown): x is ArrayBufferView {
  if (typeof x !== 'object' || x === null) return false;
  const candidate = x as { buffer?: unknown };
  return candidate.buffer instanceof ArrayBuffer;
}

export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value); // keep quotes
  if (t === 'number' || t === 'boolean' || t === 'bigint') return String(value);
  if (t === 'function') return '"[Function]"';
  if (t === 'symbol') return '"[Symbol]"';

  // Date
  if (value instanceof Date) return '"' + value.toISOString() + '"';
  // ArrayBuffer & views
  if (value instanceof ArrayBuffer) return `"[ArrayBuffer:${value.byteLength}]"`;
  if (isArrayBufferView(value)) return `"[ArrayBufferView:${(value as ArrayBufferView).byteLength}]"`;
  // Blob/File (browser)
  if (typeof Blob !== 'undefined' && value instanceof Blob) return `"[Blob:${value.size}]"`;

  // Array
  if (Array.isArray(value)) {
    return '[' + value.map(v => stableStringify(v)).join(',') + ']';
    }

  // Plain object (sort keys)
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const v = (value as Record<string, unknown>)[k];
      parts.push(JSON.stringify(k) + ':' + stableStringify(v));
    }
    return '{' + parts.join(',') + '}';
  }

  // Fallback to JSON with try/catch
  try {
    return JSON.stringify(value);
  } catch {
    return '"[Unserializable]"';
  }
}

// Fast non-cryptographic hash (FNV-1a 32-bit), return base36 string
export function fastHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  // base36 shortens representation
  return h.toString(36);
}

export interface CanonicalizeOptions {
  largeValueHashThreshold?: number;
}

export function canonicalizeKeyParts(parts: Record<string, unknown>, opts: CanonicalizeOptions = {}): string {
  const threshold = opts.largeValueHashThreshold ?? LARGE_VALUE_HASH_THRESHOLD;
  // We want a stable object with potential hashing for large body/params strings
  const stableParts: Record<string, unknown> = {};
  const keys = Object.keys(parts).sort();
  for (const k of keys) {
    const v = (parts as Record<string, unknown>)[k];
    if (k === 'body' || k === 'data') {
      const s = stableStringify(v);
      stableParts[k] = s.length > threshold ? { hash: fastHash(s), len: s.length } : s;
    } else {
      stableParts[k] = v;
    }
  }
  return stableStringify(stableParts);
}

export const KeyUtils = {
  stableStringify,
  fastHash,
  canonicalizeKeyParts
};
