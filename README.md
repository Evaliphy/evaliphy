# Evaliphy (Beta)

> **RAG Evaluation, Without the ML Jargon.**

The first QA-centric SDK for testing Retrieval-Augmented Generation. Write end-to-end evaluations for your AI pipelines using the exact same workflow you use for Playwright. No prompt engineering required.

[![npm version](https://img.shields.io/npm/v/evaliphy/beta.svg)](https://www.npmjs.com/package/evaliphy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

```bash
npm install evaliphy@beta
npx evaliphy init
```

## If you can write a test, you can evaluate AI.

Stop fighting with Python notebooks, complex ML metrics, and brittle API calls. Evaliphy gives you a fluent, type-safe API to test RAG pipelines as black boxes.

```typescript
import { evaluate, expect } from 'evaliphy';

const sample = {
  query: "What is the return policy?",
  expectedContext: "Items can be returned within 30 days."
};

evaluate("Return Policy Chat", async ({ httpClient }) => {
  // 1. Hit your RAG endpoint (streaming supported natively)
  const res = await httpClient.post('/api/chat', { message: sample.query });
  const data = await res.json();

  // 2. Assert against the LLM's behavior in plain English
  await expect(data.answer).toBeFaithful({threshold:0.8});
  await expect(data.answer).toBeRelevant();
});
```

## Built for Quality Engineers, not Data Scientists.

### 📥 Bring Your Own Data
No magic background context. Pass your golden data, CSV rows, or database records directly into the assertions so you always know exactly what is being tested.

### 🤖 Zero-Config LLM Judge
We spent hundreds of hours benchmarking LLM-as-a-judge prompts so you don't have to. Just provide your OpenAI or Anthropic API key, and Evaliphy handles the prompting, parsing, and retry logic.

### 🚀 Seamless CI/CD
It’s just Node.js. Run your RAG evaluations in GitHub Actions, GitLab CI, or Jenkins using the standard `npx evaliphy run` command. Get clear, console-native pass/fail reports.

## How it Works

1.  **Configure Once:** Set your LLM judge models (e.g., `gpt-4o-mini`) and confidence thresholds globally in `evaliphy.config.ts`.
2.  **Collect & Execute:** Evaliphy builds a deterministic test tree, then executes your HTTP calls and RAG pipelines in parallel.
3.  **Evaluate & Report:** The built-in LLM judge evaluates the responses against your assertions and returns human-readable failure reasons—not just a `false` boolean.

## Join the Beta Program

We are currently in open beta. We’re looking for QA teams and software engineers building RAG applications to help us refine the API and expand our matcher library.

- ✅ Free for commercial use during Beta
- ✅ Direct access to the core engineering team
- ✅ Influence the v1.0 roadmap

[Star on GitHub](https://github.com/priyanshus/evaliphy) | [Join the Discord](https://discord.gg/evaliphy)

## License

MIT © [Evaliphy](https://github.com/priyanshus/evaliphy)
