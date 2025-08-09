// Polyfill structuredClone for older Node versions (<=16) used in ESLint rule implementations
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
