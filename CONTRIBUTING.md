# Contributing to Evaliphy

First off, thank you for considering contributing to Evaliphy! It's people like you who make Evaliphy such a great tool for the RAG community.

This guide will walk you through everything you need to know to contribute effectively.

## Table of Contents

- [Quick Start for Contributors](#quick-start-for-contributors)
- [Development Environment Setup](#development-environment-setup)
- [Understanding the Project Structure](#understanding-the-project-structure)
- [Running Tests](#running-tests)
- [Contributing Workflow](#contributing-workflow)
- [Best Practices for LLM Interaction (Save Tokens!)](#best-practices-for-llm-interaction-save-tokens)
- [Troubleshooting](#troubleshooting)
- [Code of Conduct](#code-of-conduct)

---

## Quick Start for Contributors

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/evaliphy.git
cd evaliphy

# 2. Install dependencies
pnpm install

# 3. Build the project
pnpm build

# 4. Run tests
pnpm test
```

---

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 24.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: Package manager ([Install](https://pnpm.io/installation))
- **Git**: Version control ([Download](https://git-scm.com/))

### Step-by-Step Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/evaliphy.git
   cd evaliphy
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Evaliphy/evaliphy.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Build the project**:
   ```bash
   pnpm build
   ```

### Environment Variables

Create a `.env` file in the `e2e-tests/` directory for running E2E tests:

```bash
# e2e-tests/.env
OPENAI_API_KEY=your_openai_key_here
# OR
OPENROUTER_API_KEY=your_openrouter_key_here
```

> ⚠️ **Never commit `.env` files!** They are already in `.gitignore`.

---

## Understanding the Project Structure

```
evaliphy/
├── packages/           # Core packages
│   ├── ai/            # AI provider integrations
│   ├── assertions/    # Evaluation assertions (toBeFaithful, etc.)
│   ├── cli/           # Command-line interface
│   ├── client/        # HTTP client for API calls
│   ├── core/          # Core evaluation engine
│   └── reporters/     # Output formatters (console, HTML, etc.)
├── e2e-tests/         # End-to-end test suite
│   ├── evals/         # Test evaluation files
│   └── evaliphy.config.ts  # Test configuration
├── docs/              # Documentation source
├── src/               # Entry points
└── website/           # Documentation website
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode (useful during development)
pnpm test -- --watch

# Run tests for a specific package
cd packages/core && pnpm test
```

### E2E Tests

The E2E tests verify the complete evaluation workflow:

```bash
# 1. Build the project first
pnpm build

# 2. Run E2E tests
cd e2e-tests
pnpm eval

# Or from project root:
node dist/bin.mjs eval --eval-dir=./e2e-tests/evals
```

#### Setting up a Local Test Server

For E2E tests, you need a running API endpoint:

```bash
# Option 1: Use the example mock server (if available)
cd e2e-tests && node mock-server.js

# Option 2: Point to a staging/test environment
# Edit e2e-tests/evaliphy.config.ts:
export default defineConfig({
  http: {
    baseUrl: 'https://your-test-api.com',
    headers: {
      'Authorization': `Bearer \${process.env.TEST_API_KEY}`
    }
  }
});
```

#### Verifying Changes with E2E Suite

Before submitting a PR, ensure your changes pass:

1. **Build succeeds**: `pnpm build`
2. **Unit tests pass**: `pnpm test`
3. **E2E tests pass**: `cd e2e-tests && pnpm eval`
4. **Linting passes**: `pnpm lint`

---

## Contributing Workflow

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/issue-description
```

**Branch Naming Conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### 2. Make Your Changes

- Follow the existing code style
- Write clear, well-documented code
- Add tests for new functionality
- Update documentation if needed

### 3. Commit Your Changes

```bash
git add .
git commit -m "type(scope): description"
```

**Commit Message Format** (Conventional Commits):
```
feat(assertions): add toBeConcise matcher
fix(cli): resolve config loading issue
docs(readme): update installation instructions
refactor(core): simplify evaluation loop
test(e2e): add tests for streaming responses
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub:

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template with:
   - Clear description of changes
   - Link to related issues (e.g., "Fixes #15")
   - Testing instructions
   - Screenshots (if UI changes)

### 5. PR Review Process

- Maintainers will review your PR within a few days
- Address any requested changes
- Once approved, a maintainer will merge

---

## Best Practices for LLM Interaction (Save Tokens!)

When developing and testing Evaliphy, you'll interact with LLM APIs. Here are tips to minimize costs:

### 1. Use Smaller Models for Development

```typescript
// evaliphy.config.ts
export default defineConfig({
  llmAsJudgeConfig: {
    model: 'gpt-4o-mini',  // Cheaper than GPT-4o
    // or
    model: 'claude-3-haiku-20240307',  // Fast and cheap
  }
});
```

### 2. Test with Cached Responses

```typescript
// Use cached responses during development
const mockResponse = {
  answer: "The return policy is 30 days.",
  context: ["Our return policy allows returns within 30 days..."]
};
```

### 3. Limit Evaluation Dataset Size

```typescript
// Only run a subset of tests during development
evaluate("Quick Test", async () => {
  // Test with 1-2 examples instead of the full dataset
});
```

### 4. Use OpenRouter for Cheaper Access

```typescript
export default defineConfig({
  llmAsJudgeConfig: {
    model: 'google/gemini-flash-1.5',  // Often cheaper than direct API
    provider: {
      type: 'openai',  // OpenRouter is OpenAI-compatible
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    }
  }
});
```

### 5. Enable Request Caching

Set up local caching for repeated tests:

```bash
# In your shell profile
export EVALIPHY_CACHE_REQUESTS=true
export EVALIPHY_CACHE_DIR=.evaliphy-cache
```

---

## Troubleshooting

### Common Issues

#### Issue: `pnpm install` fails

**Solution**:
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Issue: Build fails with TypeScript errors

**Solution**:
```bash
# Ensure you're on Node 24+
node --version

# Clean and rebuild
pnpm clean  # if available
rm -rf dist
pnpm build
```

#### Issue: E2E tests timeout

**Solution**:
```bash
# Check your API is reachable
curl https://your-api.com/health

# Increase timeout in evaliphy.config.ts
export default defineConfig({
  timeout: 120000,  // 2 minutes
});
```

#### Issue: LLM API returns 401 Unauthorized

**Solution**:
```bash
# Verify your API key is set
echo $OPENAI_API_KEY

# For OpenRouter, use:
echo $OPENROUTER_API_KEY

# Make sure .env file exists in e2e-tests/
cat e2e-tests/.env
```

#### Issue: Changes not reflected in E2E tests

**Solution**:
```bash
# Rebuild after every change
pnpm build

# Then run E2E tests
cd e2e-tests && pnpm eval
```

### Getting Help

- Check [Documentation](https://evaliphy.com)
- Search [existing issues](https://github.com/Evaliphy/evaliphy/issues)
- Join [Discussions](https://github.com/Evaliphy/evaliphy/discussions)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## How Can I Contribute?

### Reporting Bugs

1. **Check the FAQ** and [Documentation](https://evaliphy.com)
2. **Search existing issues** to see if the bug has already been reported
3. If not, **open a new issue** using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml)

### Suggesting Enhancements

1. **Search existing issues** for similar suggestions
2. If not found, **open a new issue** using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml)

### Pull Requests

We welcome PRs for:
- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage improvements

---

Thank you for contributing to Evaliphy! 🎉
