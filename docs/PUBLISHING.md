# Publishing Guide

This guide explains how to publish the `jsonplaceholder-client-lib` package to NPM.

## Prerequisites

1. **NPM Account**: You need an NPM account with publishing permissions
2. **NPM Token**: Generate an automation token from npmjs.com
3. **GitHub Repository**: Code should be pushed to GitHub

## Local Publishing

### 1. Build and Test
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Run linting
npm run lint
```

### 2. Version Management
```bash
# For patch version (1.0.0 -> 1.0.1)
npm version patch

# For minor version (1.0.0 -> 1.1.0)
npm version minor

# For major version (1.0.0 -> 2.0.0)
npm version major

# Or specify exact version
npm version 1.2.3
```

### 3. Publish
```bash
# Login to NPM (one-time setup)
npm login

# Publish the package
npm publish
```

## Automated Publishing via GitHub Actions

### Setup

1. **Create NPM Token**:
   - Go to npmjs.com → Account → Access Tokens
   - Click "Generate New Token" → "Automation"
   - Copy the token

2. **Add GitHub Secret**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

### Publishing Methods

#### Method 1: GitHub Releases (Recommended)

1. Create a new release on GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Go to GitHub → Releases → "Create a new release"
3. Choose the tag you created
4. Add release notes
5. Click "Publish release"

The GitHub Action will automatically:
- Run tests on Node.js 16, 18, and 20
- Build the package
- Publish to NPM

#### Method 2: Manual Workflow Dispatch

1. Go to GitHub → Actions → "Publish to NPM"
2. Click "Run workflow"
3. Choose the version bump type (patch/minor/major/specific version)
4. Click "Run workflow"

This will:
- Bump the version
- Create a git tag
- Run tests and build
- Publish to NPM
- Create a GitHub release

## Package Structure

The published package includes:

```
jsonplaceholder-client-lib/
├── dist/
│   ├── index.js          # CommonJS build
│   ├── index.d.ts        # TypeScript declarations
│   ├── esm/
│   │   └── index.js      # ES Module build
│   └── *.js.map          # Source maps
├── README.md
└── LICENSE
```

## Package.json Configuration

Key fields for NPM publishing:

```json
{
  "name": "jsonplaceholder-client-lib",
  "main": "dist/index.js",           // CommonJS entry
  "module": "dist/esm/index.js",     // ES Module entry
  "types": "dist/index.d.ts",        // TypeScript declarations
  "exports": {                       // Modern Node.js exports
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],  // Files to include
  "publishConfig": {
    "access": "public"               // Make package public
  }
}
```

## Build Process

The build creates three outputs:

1. **CommonJS** (`dist/*.js`): For Node.js and older bundlers
2. **ES Modules** (`dist/esm/*.js`): For modern bundlers and Node.js ESM
3. **TypeScript Declarations** (`dist/*.d.ts`): For TypeScript support

## Testing the Published Package

After publishing, test the package:

```bash
# Create a test directory
mkdir test-package && cd test-package

# Initialize npm and install your package
npm init -y
npm install jsonplaceholder-client-lib

# Test CommonJS
node -e "const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib'); console.log('✅ CommonJS works')"

# Test ES Modules (create test.mjs)
echo "import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib'; console.log('✅ ESM works')" > test.mjs
node test.mjs
```

## Troubleshooting

### Common Issues

1. **"npm ERR! 403 Forbidden"**
   - Check NPM token is valid
   - Verify package name isn't taken
   - Ensure you have publish permissions

2. **"npm ERR! Package name too similar"**
   - Change package name in package.json
   - Check availability: `npm view jsonplaceholder-client-lib`

3. **Build Failures**
   - Run `npm run clean && npm run build` locally
   - Check TypeScript errors
   - Verify all dependencies are installed

### Version Conflicts

If you need to unpublish (within 24 hours):
```bash
npm unpublish jsonplaceholder-client-lib@1.0.0
```

For older versions, use deprecation:
```bash
npm deprecate jsonplaceholder-client-lib@1.0.0 "Deprecated due to security issues"
```

## Best Practices

1. **Always test before publishing**
2. **Use semantic versioning** (patch/minor/major)
3. **Keep dependencies up to date**
4. **Write comprehensive changelogs**
5. **Test in multiple Node.js versions**
6. **Use scoped packages if needed** (`@your-org/package-name`)

## Monitoring

After publishing, monitor:

- **NPM Downloads**: npmjs.com/package/jsonplaceholder-client-lib
- **Issues**: GitHub Issues tab
- **Dependents**: GitHub Insights → Dependency graph
- **Security**: `npm audit` regularly
