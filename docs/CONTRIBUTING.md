# Contributing to JSONPlaceholder Client Library

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the JSONPlaceholder Client Library.

## 🚀 Quick Start for Contributors

### Prerequisites

- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher  
- **Git**: Latest version

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/client-library.git
   cd client-library
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   npm run test:integration
   npm run test:coverage
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
client-library-2/
├── src/                          # Main library source
│   ├── __tests__/               # Unit tests
│   ├── client.ts                # Main client implementation
│   ├── cache.ts                 # Caching system
│   ├── logger.ts                # Logging system
│   ├── performance.ts           # Performance monitoring
│   └── types.ts                 # TypeScript definitions
├── packages/
│   └── react/                   # React hooks package
│       ├── src/                 # React hooks source
│       └── __tests__/          # React hooks tests
├── examples/                    # Usage examples
├── docs/                       # Documentation
└── tests/integration/          # Integration tests
```

## 🔧 Development Workflow

### 1. Working on Features

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests first (TDD approach recommended)
   - Implement the feature
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test
   npm run test:integration
   npm run lint
   ```

4. **Build and validate**
   ```bash
   npm run build
   npm run test:validate  # Cross-package compatibility
   ```

### 2. Working on React Hooks

If you're contributing to the React package:

```bash
cd packages/react
npm install
npm run build
npm test
```

### 3. Running Examples

Test your changes with examples:

```bash
npm run demo:server
# Open examples/basic-usage.js in another terminal
```

## 📝 Coding Standards

### TypeScript Guidelines

- **Strict mode**: All code must pass TypeScript strict checks
- **Type safety**: Prefer explicit types over `any`
- **JSDoc**: Document public APIs with JSDoc comments
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for classes)

### Code Style

We use ESLint for code formatting:

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Testing Requirements

All contributions must include tests:

- **Unit tests**: For individual functions/methods
- **Integration tests**: For complete workflows
- **React tests**: For React hooks (using React Testing Library)
- **Coverage**: Maintain >85% code coverage

### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', () => {
    // Test implementation
  });
});
```

## 🏗️ Architecture Guidelines

### Core Principles

1. **Modular Design**: Features should be tree-shakeable
2. **Type Safety**: Full TypeScript coverage
3. **Performance**: Minimal bundle size impact
4. **Backward Compatibility**: Follow semantic versioning

### Adding New Features

1. **Core Library Features** (`src/`):
   - Add to appropriate module (caching, logging, etc.)
   - Export from `src/index.ts` (full) and/or `src/core.ts` (lightweight)
   - Add comprehensive tests

2. **React Hooks** (`packages/react/`):
   - Follow existing hook patterns
   - Use the core client internally
   - Include React Testing Library tests

### Performance Considerations

- **Bundle Size**: Check impact with `npm run build:analyze`
- **Tree Shaking**: Ensure modular exports work correctly
- **Caching**: Consider cache implications for new features
- **Memory**: Avoid memory leaks in long-running applications

## 🧪 Testing Guidelines

### Writing Tests

1. **Test Structure**:
   ```typescript
   import { JsonPlaceholderClient } from '../client';
   
   describe('YourFeature', () => {
     let client: JsonPlaceholderClient;
     
     beforeEach(() => {
       client = new JsonPlaceholderClient();
     });
     
     it('should handle expected behavior', async () => {
       // Test implementation
     });
   });
   ```

2. **Mock External Dependencies**:
   ```typescript
   import MockAdapter from 'axios-mock-adapter';
   
   const mockAxios = new MockAdapter(client['axiosInstance']);
   mockAxios.onGet('/posts').reply(200, mockData);
   ```

3. **Test Error Conditions**:
   ```typescript
   it('should handle network errors gracefully', async () => {
     mockAxios.onGet('/posts').networkError();
     
     await expect(client.getPosts()).rejects.toThrow();
   });
   ```

### Test Categories

- **Unit Tests**: Individual methods and functions
- **Integration Tests**: Complete user workflows
- **Error Handling**: Network failures, invalid data
- **Performance Tests**: Caching, memory usage
- **React Tests**: Hook behavior and state management

## 📋 Pull Request Process

### Before Submitting

1. **Self-Review Checklist**:
   - [ ] All tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated (if needed)
   - [ ] No console.log statements left behind
   - [ ] Performance impact considered

2. **Commit Message Format**:
   ```
   type(scope): description
   
   feat(cache): add background refresh capability
   fix(client): handle network timeout errors
   docs(readme): update installation instructions
   test(hooks): add usePosts error handling tests
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewer will test functionality
4. **Documentation**: Ensure docs are clear and complete

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues**: Check if already reported
2. **Reproduce the bug**: Ensure it's consistently reproducible
3. **Test with latest version**: Update to newest release

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Reproduction Steps
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Library version: 
- Node.js version:
- Browser (if applicable):
- Operating System:

## Additional Context
Screenshots, error messages, etc.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why would this feature be useful?

## Proposed Implementation
How might this work?

## Alternatives Considered
Other approaches you've thought of

## Additional Context
Any other relevant information
```

## 🏷️ Release Process

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Automated Releases

Releases are automated using semantic-release:

- **Commit Types**:
  - `feat:` → Minor version bump
  - `fix:` → Patch version bump
  - `BREAKING CHANGE:` → Major version bump

## 🔒 Security

### Reporting Security Issues

Please email security issues to: [security@yourproject.com]

**Do not** create public GitHub issues for security vulnerabilities.

### Security Guidelines

- Keep dependencies updated
- Follow security best practices
- Use automated security scanning
- Review code for potential vulnerabilities

## 📞 Getting Help

### Resources

- **Documentation**: [docs/](../docs/)
- **Examples**: [examples/](../examples/)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)

### Community

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Discord/Slack**: [Community link if available]

### Maintainers

- **@sirhCC**: Primary maintainer
- **Core Team**: [List other maintainers]

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to make this library better! 🎉**
