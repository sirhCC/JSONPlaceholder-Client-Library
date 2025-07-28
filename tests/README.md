# Tests

This directory contains various types of tests for the JSONPlaceholder Client Library.

## Structure

- **`integration/`** - Integration tests that validate package builds, exports, and end-to-end functionality
- **`demos/`** - Demo applications and examples showing how to use the library

## Integration Tests

The integration tests validate:
- Package builds (CommonJS, ESM, TypeScript declarations)
- Export validation
- Cross-package compatibility
- Build system validation

## Demos

The demos include:
- HTML examples showing browser usage
- Demo server applications
- React application examples

## Running Tests

From the root directory:

```bash
# Run unit tests
npm test

# Run integration tests
node tests/integration/test-package.js
node tests/integration/validate-packages.js

# Start demo server
node tests/demos/demo-server.js
```
