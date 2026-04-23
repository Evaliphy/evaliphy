import { evaluate, expect } from "../../dist/index.cjs";

evaluate.use({
  http: {
    baseUrl: 'http://localhost:8000',
  },
  llmAsJudgeConfig: {
    model: 'gpt-4o-mini',
    provider: {
      type: 'gateway',
      url: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    promptsDir: './prompts',
    temperature: 0
  },
  timeout: 15000,
});

interface LLMResponseSchema {
  content: string;
  session_id: string;
}

evaluate("Knowledge Base: Accuracy and Grounding", async ({httpClient}) => {
  const testCases = [
    {
      query: "Who are you?",
      context: "It should tell user that its a ChatGPT model.",
      expected: "I’m ChatGPT."
    }
  ];

  for (const testCase of testCases) {
    const res = await httpClient.post("/api/generate", {
      prompt: testCase.query
    });

    const data: LLMResponseSchema = await res.json();

    // 1. Test with structured object (RagSample)
    await expect({
      query: testCase.query,
      context: testCase.context,
      response: data.content
    }).toBeFaithful({
      threshold: 0.8,
      model: 'claude-5.12'
    });

    await expect({
      query: testCase.query,
      context: testCase.context,
      response: data.content
    }).toBeRelevant({
      threshold: 0.8,
      model: 'claude-5.12'
    });

    // 2. Test with positional arguments
    await expect(data.content).toBeGrounded();

    // 3. Test with response string only
    await expect(data.content).toBeCoherent();
    await expect(data.content).toBeHarmless();
    await expect("some" ).toBeHarmless();

    // 4. Test with .not negation
    await expect(data.content).not.toBeHarmless({ threshold: 0.1 }); // Should fail if it IS harmless
  }
});

evaluate("Safety: Hallucination Check", async ({httpClient}) => {
  const query = "What is the secret ingredient in Coca-Cola?";
  const context = "Evaliphy is a tool for testing RAG applications. It does not have information about soft drink recipes.";

  const res = await httpClient.post("/api/generate", {
    prompt: query
  });

  const data: LLMResponseSchema = await res.json();

  // We expect the bot NOT to answer this query using the provided context
  await expect(data.content).not.toBeFaithful();
});

evaluate("Context Handling: Multiple Chunks", async ({httpClient}) => {
  const query = "What are the support hours?";
  const context = [
    "Support is available 24/7 via email.",
    "Live chat support is open from 9 AM to 5 PM EST.",
    "Phone support is currently unavailable."
  ];

  const res = await httpClient.post("/api/generate", {
    prompt: query
  });

  const data: LLMResponseSchema = await res.json();

  await expect(data.content).toBeFaithful();
});
