# Evaliphy (Beta)

<p align="center">
  <strong>Test Your AI Features Like The Rest Of Your Product</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/evaliphy"><img src="https://img.shields.io/npm/v/evaliphy/beta.svg" alt="npm version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://evaliphy.com"><img src="https://img.shields.io/badge/docs-latest-blue.svg" alt="Documentation" /></a>
  <a href="https://github.com/Evaliphy/evaliphy/actions"><img src="https://github.com/Evaliphy/evaliphy/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
</p>

---

Evaliphy is an end-to-end testing solution for evaluating AI applications. It treats AI pipelines as black boxes, allowing you to write robust, production-ready evaluations using the same workflow you use for end-to-end testing.

If you can write a Playwright or Vitest test, you can evaluate AI.

[Documentation](https://evaliphy.com)

## ✨ Key Features

- **Playwright-Style API**: Fluent, chainable assertions that feel natural to QA engineers.
- **Black-Box Testing**: Evaluate observable outputs (responses) without needing access to internal vector DBs or prompt templates.
- **LLM-as-a-Judge**: Built-in, production-grade evaluators for Faithfulness, Relevance, Groundedness, Coherence, and Harmlessness.
- **Deterministic Assertions**: `toContain` and similar matchers for exact, score-free checks alongside LLM-based ones.
- **CI/CD Ready**: Runs in your existing pipelines and produces structured HTML + console reports your whole team can read.
- **TypeScript Native**: Full type safety and IDE autocompletion for your evaluation suites.
- **Multi-Provider**: Works with OpenAI, Anthropic, Google, Groq, Mistral, Cohere, or any OpenAI-compatible gateway.

## 📋 Prerequisites

- **Node.js** >= 24.0.0
- An API key for at least one [supported LLM provider](#-supported-llm-providers)

## 🚀 Quick Start

### 1. Install & Initialize

```bash
npm install -g evaliphy
npx evaliphy init my-eval-project
cd my-eval-project
npm install
```

### 2. Write Your First Eval

Create a file like `chat.eval.ts`:

```typescript
import { evaluate, expect } from 'evaliphy';

evaluate("Customer Support Bot", async ({ httpClient }) => {
  const query = "What is the return policy?";
  
  // 1. Hit your real RAG endpoint
  const res = await httpClient.post('/api/chat', { message: query });
  const { answer, context } = await res.json();

  // 2. Assert against the LLM's behavior in plain English
  await expect({ query, response: answer, context }).toBeFaithful();
  await expect({ query, response: answer, context }).toBeRelevant({ threshold: 0.9 });
  await expect({ response: answer }).toBeHarmless();
});
```

### 3. Run the Evals

```bash
npx evaliphy eval
```

## ⚙️ Configuration

Evaliphy is configured via an `evaliphy.config.ts` file in your project root. Use the `defineConfig` helper for full TypeScript support and autocompletion.

```typescript
import { defineConfig } from 'evaliphy';

export default defineConfig({
  // 1. Configure your RAG API
  http: {
    baseUrl: 'https://api.your-service.com',
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`
    }
  },

  // 2. Setup the LLM Judge
  llmAsJudgeConfig: {
    model: 'gpt-4o-mini',
    provider: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
    }
  },

  // 3. Reporting
  reporters: ['console', 'html']
});
```

## 🔍 Available Assertions

### LLM-as-a-Judge (scored 0.0–1.0)

| Assertion | Description | Default Threshold |
|---|---|---|
| `toBeFaithful()` | Response does not hallucinate facts outside the provided context | 0.7 |
| `toBeRelevant()` | Response directly addresses the user's query | 0.7 |
| `toBeGrounded()` | Claims in the response are supported by the retrieved context | 0.7 |
| `toBeCoherent()` | Response is logically consistent and well-structured | 0.7 |
| `toBeHarmless()` | Response contains no harmful, toxic, or unsafe content | 0.7 |

Pass a custom threshold to any scorer: `toBeFaithful({ threshold: 0.9 })`.

### Deterministic (exact match)

| Assertion | Description |
|---|---|
| `toContain(substring)` | Response includes the given substring |

## 🌐 Supported LLM Providers

Use any of these as the `llmAsJudgeConfig.provider`:

| Provider | `type` | Notes |
|---|---|---|
| OpenAI | `openai` | Recommended for getting started (`gpt-4o-mini`) |
| Anthropic | `anthropic` | Claude models |
| Google | `google` | Gemini models |
| Groq | `groq` | Fast inference |
| Mistral | `mistral` | Mistral models |
| Cohere | `cohere` | Command models |
| Any gateway | `gateway` | OpenRouter, LiteLLM, Vercel AI Gateway, etc. |

**Gateway example** (OpenRouter):

```typescript
llmAsJudgeConfig: {
  model: 'openai/gpt-4o-mini',
  provider: {
    type: 'gateway',
    url: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    name: 'openrouter'
  }
}
```

## 🧠 Why Evaliphy?

### It fits where your tests already live.
Eval files sit in your repo alongside your other tests. No Python notebooks, no complex ML metrics, and no brittle manual testing.

### You test your real API.
Evaliphy makes HTTP calls to your actual running service. If your RAG system breaks in production, Evaliphy catches it the same way your E2E tests catch a broken UI.

### The judges are built-in.
Faithfulness, relevance, groundedness — the assertions that matter are shipped with the framework. No prompt writing or LLM wiring required.

## 🛠 How it Works

Evaliphy uses an **LLM-as-a-Judge** workflow to provide objective, repeatable scores for subjective AI outputs.

1. **Data Submission**: Your query, response, and context are sent to a high-capability judge model.
2. **Scoring**: The judge evaluates the input against a specialized rubric (0.0 - 1.0).
3. **Thresholding**: If the score meets your threshold (default 0.7), the test passes.

![Evaliphy Internal Mechanism](./website/public/images/how-evaliphy-works.png)

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Reporting bugs and requesting features
- Setting up a local development environment
- Submitting pull requests

Good first issues are labeled [`good first issue`](https://github.com/Evaliphy/evaliphy/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

## 🤝 Join the Beta

We are currently in open beta and looking for feedback from QA teams and engineers building RAG applications.

- ✅ **Free** for commercial use during Beta.
- ✅ **Influence** the v1.0 roadmap.
- ✅ **Contribute** to our growing library of matchers.

[Documentation](https://evaliphy.com) | [GitHub](https://github.com/evaliphy/evaliphy) | [Submit Feedback](https://forms.gle/9ztrqUCXUg2YGSJJA)

## 📄 License

MIT © [Evaliphy](https://github.com/evaliphy/evaliphy)
