# Evaliphy (Beta)

<p align="center">
  <strong>AI Evaluation Framework — Assertions for LLM-as-Judge</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@evaliphy/sdk"><img src="https://img.shields.io/npm/v/@evaliphy/sdk/beta.svg" alt="npm version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://evaliphy.com"><img src="https://img.shields.io/badge/docs-latest-blue.svg" alt="Documentation" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js version" /></a>
</p>

---

Evaliphy is an AI evaluation framework that treats your AI system as a black box. Write assertions against your real API, get structured results, and catch regressions in CI — without touching your pipeline internals or writing prompt engineering from scratch.

Built-in LLM-as-Judge assertions handle the hard parts. You focus on writing evaluations, not wiring up models.

![Evaliphy Demo](./docs/gif/demo.gif)

---

## Prerequisites

- Node JS 24.0.0 or higher
- An OpenAI API key or any OpenAI-compatible provider
- A running AI application with an HTTP endpoint

---

## Quick start

### 1. Install and initialise

```bash
npm install -g @evaliphy/sdk
evaliphy init my-eval-project
cd my-eval-project
npm install
```

### 2. Set your environment variables

```bash
cp .env.example .env
```

Add your API key to `.env`:

```
OPENAI_API_KEY=your-api-key-here
```

### 3. Configure Evaliphy

Open `evaliphy.config.ts` and point it at your AI application:

```typescript
import { defineConfig } from "@evaliphy/sdk";

export default defineConfig({
  http: {
    baseUrl: "https://api.your-service.com",
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
  },
  llmAsJudgeConfig: {
    model: "gpt-4o-mini",
    provider: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
  reporters: ["console", "html"],
});
```

### 4. Write your first evaluation

Create `evals/chat.eval.ts`:

```typescript
import { evaluate, expect } from "@evaliphy/sdk";

const sample = {
  query: "What is the return policy?",
  expectedContext: "Items can be returned within 30 days."
};

evaluate("Return Policy Chat", async ({ httpClient }) => {
  // 1. Hit your RAG endpoint
  const res = await httpClient.post('/api/chat', { message: sample.query });
  const data = await res.json();

  // 2. Assert in plain English
  await expect({
    query: sample.query,
    context: sample.expectedContext,
    response: data.answer
  }).toBeFaithful();

  // Or use positional arguments for simplicity
  await expect(sample.query, sample.expectedContext, data.answer).toBeRelevant({ threshold: 0.7 });
});
```

### 5. Run your evaluations

```bash
evaliphy eval
```

---

## Assertions

### LLM assertions

Scored 0.0 to 1.0 by a configurable judge model. Pass if the score meets or exceeds the threshold.

| Assertion        | What it checks                                |
| ---------------- | --------------------------------------------- |
| `toBeFaithful()` | Response is grounded in the retrieved context |
| `toBeRelevant()` | Response addresses the query                  |
| `toBeGrounded()` | Claims are supported by source documents      |
| `toBeCoherent()` | Response is logically consistent              |
| `toBeHarmless()` | Response contains no harmful or toxic content |

All LLM assertions accept an optional config object:

```typescript
await expect({ query, response, context }).toBeFaithful({
  threshold: 0.9, // override global threshold for this assertion
});
```

### Deterministic assertions

Coming in v1. Fast, free, no LLM call required.

---

## Configuration reference

| Field                         | Type   | Default       | Description                     |
| ----------------------------- | ------ | ------------- | ------------------------------- |
| `http.baseUrl`                | string | —             | Base URL of your AI application |
| `http.timeout`                | number | `10000`       | Request timeout in ms           |
| `http.headers`                | object | `{}`          | Headers sent with every request |
| `llmAsJudgeConfig.model`      | string | `gpt-4o-mini` | Judge model                     |
| `llmAsJudgeConfig.threshold`  | number | `0.7`         | Global pass threshold           |
| `llmAsJudgeConfig.promptsDir` | string | —             | Path to custom prompt directory |
| `reporters`                   | array  | `['console']` | Output formats                  |

---

## Supported LLM Providers

Evaliphy uses the [Vercel AI SDK](https://sdk.vercel.ai) under the hood, which means it supports a wide range of LLM providers out of the box. Configure your provider once in `evaliphy.config.ts` and Evaliphy handles the rest.

| Provider | Type key | Required field |
|---|---|---|
| OpenAI | `openai` | `apiKey` |
| Anthropic | `anthropic` | `apiKey` |
| Azure OpenAI | `azure` | `apiKey`, `resourceName` |
| Google Gemini | `google` | `apiKey` |
| Mistral | `mistral` | `apiKey` |
| OpenAI-compatible gateway | `gateway` | `apiKey`, `url` |

### OpenAI

```typescript
llmAsJudgeConfig: {
  model: 'gpt-4o-mini',
  provider: {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  }
}
```

### Anthropic

```typescript
llmAsJudgeConfig: {
  model: 'claude-3-5-haiku-20241022',
  provider: {
    type: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
  }
}
```

### OpenAI-compatible gateway (OpenRouter, LiteLLM, etc.)

```typescript
llmAsJudgeConfig: {
  model: 'gpt-4o-mini',
  provider: {
    type: 'gateway',
    url: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  }
}
```

### Azure OpenAI

```typescript
llmAsJudgeConfig: {
  model: 'gpt-4o-mini',
  provider: {
    type: 'azure',
    resourceName: process.env.AZURE_RESOURCE_NAME,
    apiKey: process.env.AZURE_API_KEY,
  }
}
```

Any provider supported by the Vercel AI SDK can be used with Evaliphy. See the [Vercel AI SDK provider documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for the full list.

---

## Custom prompts

Evaliphy ships with built-in prompts for every assertion. Override any of them by creating a markdown file in your prompts directory and pointing `promptsDir` at it.

```
my-eval-project/
  prompts/
    faithfulness.md    ← overrides built-in faithfulness prompt
```

```typescript
llmAsJudgeConfig: {
  promptsDir: "./prompts";
}
```

Each prompt file uses frontmatter to declare its input variables:

```markdown
---
name: faithfulness
input_variables:
  - question
  - context
  - response
---

You are evaluating a RAG system for a UK e-commerce company.
Faithfulness means every claim traces back to the retrieved context.

## Question

{{question}}

## Context

{{context}}

## Response

{{response}}
```

See the [custom prompts guide](https://evaliphy.com/docs/llm-as-judge#using-custom-prompts) for full documentation.

---

## CI integration

Evaliphy exits with a non-zero code when any assertion fails, making it compatible with any CI pipeline.

### GitHub Actions

```yaml
name: Evaliphy

on: [push, pull_request]

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: evaliphy eval
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          API_KEY: ${{ secrets.API_KEY }}
```

---

## Reporters

| Reporter  | Output       | Description                                   |
| --------- | ------------ | --------------------------------------------- |
| `console` | Terminal     | Streams results as tests run                  |
| `json`    | `.json` file | Machine-readable, good for CI pipelines       |
| `html`    | `.html` file | Self-contained visual report                  |
| `csv`     | `.csv` file  | Coming Soon                       |
| `xlsx`    | `.xlsx` file | Coming Soon |

Configure in `evaliphy.config.ts`:

---

## How it works

1. Your eval file makes an HTTP call to your real running API
2. The response and context are passed to the assertion
3. The assertion sends a rendered prompt to the judge model
4. The judge scores the response 0.0 to 1.0
5. The score is compared against the threshold — pass or fail
6. Results are written to all configured reporters

---

## Why Evaliphy

**It fits where your tests already live.** Eval files are TypeScript files that sit in your repo alongside your other tests. No Python notebooks, no complex setup, no new workflow to learn.

**You test your real API.** Evaliphy makes HTTP calls to your actual running service — not a mocked response or an offline dataset. If your AI system breaks in production, Evaliphy catches it.

**The judges are built in.** Faithfulness, relevance, groundedness — the assertions that matter are shipped with the framework. No prompt writing or LLM wiring required.

**Configurable when you need it.** Sensible defaults out of the box. Override the judge model globally, per file, or per assertion. Bring your own prompts for domain-specific evaluation.

---

## Project structure

After running `evaliphy init`, your project looks like this:

```
my-eval-project/
  evals/
    example.eval.ts       — sample evaluation to get you started
  prompts/                — optional custom prompt overrides
  evaliphy.config.ts      — main configuration file
  .env.example            — environment variable template
  package.json
  tsconfig.json
```

---

## Beta

Evaliphy is in open beta. The API may change between versions. We are looking for feedback from engineers and teams building AI applications.

- Free for commercial use during beta
- Influence the v1.0 roadmap directly
- Contribute to the growing assertion library

[Submit feedback](https://forms.gle/9ztrqUCXUg2YGSJJA)

---

## Contributing

Contributions are welcome. Please read the [contributing guide](./CONTRIBUTING.md) before opening a pull request.

---

## Built by the community

<a href="https://github.com/Evaliphy/evaliphy/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Evaliphy/evaliphy" />
</a>

---

## License

MIT © [Evaliphy](https://github.com/evaliphy/evaliphy)

