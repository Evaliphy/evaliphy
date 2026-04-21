import { getConfig } from '@evaliphy/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssertionEngine } from '../../src/engine/AssertionEngine.js';
import type { RagSample } from '../../src/engine/types.js';
import { expect as evaliphyExpect } from '../../src/expect/expect.js';

// Mock @evaliphy/ai BEFORE importing expect
vi.mock('@evaliphy/ai', () => ({
  createLLMClient: vi.fn().mockReturnValue({
    generateObject: vi.fn(),
    generateText: vi.fn(),
  }),
}));

vi.mock('../../src/engine/AssertionEngine.js', () => ({
  AssertionEngine: {
    run: vi.fn(),
  },
}));

vi.mock('@evaliphy/core', async () => {
  const actual = await vi.importActual('@evaliphy/core');
  return {
    ...actual,
    getConfig: vi.fn(),
    ConfigLoader: {
      getInstance: vi.fn().mockReturnValue({
        cachedConfig: {
          llmAsJudgeConfig: {
            provider: 'openai',
            apiKey: 'test-key',
          },
        },
      }),
    },
  };
});

describe('expect() and MatcherChain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getConfig as any).mockReturnValue({
      llmAsJudgeConfig: {
        provider: 'openai',
        apiKey: 'test-key',
      },
    });
  });

  it('should support the professional RagSample signature', async () => {
    const input: RagSample = {
      response: "You can find your API key in the dashboard.",
      query: "Where is my API key?",
      context: "API keys are located in the 'Settings > API' section of the user dashboard.",
    };

    (AssertionEngine.run as any).mockResolvedValue({
      passed: true,
      score: 1.0,
      reason: 'Perfect match',
      assertion: 'toBeFaithful',
    });

    await evaliphyExpect(input).toBeFaithful();

    expect(AssertionEngine.run).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          query: "Where is my API key?",
        }),
      })
    );
  });

  it('should support positional arguments for RAG triad', async () => {
    (AssertionEngine.run as any).mockResolvedValue({
      passed: true,
      score: 1.0,
      reason: 'Perfect match',
      assertion: 'toBeFaithful',
    });

    await evaliphyExpect(
      "Where is my API key?",
      "API keys are in settings.",
      "You can find it in settings."
    ).toBeFaithful();

    expect(AssertionEngine.run).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          query: "Where is my API key?",
          context: "API keys are in settings.",
          response: "You can find it in settings."
        }),
      })
    );
  });

  it('should support single string argument for response-only assertions', async () => {
    (AssertionEngine.run as any).mockResolvedValue({
      passed: true,
      score: 1.0,
      reason: 'Logical',
      assertion: 'toBeCoherent',
    });

    await evaliphyExpect("This is a coherent sentence.").toBeCoherent();

    expect(AssertionEngine.run).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'toBeCoherent' }),
      expect.objectContaining({
        input: { response: "This is a coherent sentence." }
      })
    );
  });

  it('should return EvalResult when returnResult option is true', async () => {
    const input: RagSample = {
      response: "Response",
      query: "Query",
      context: "Context"
    };

    (AssertionEngine.run as any).mockResolvedValue({
      passed: true,
      score: 0.9,
      reason: 'Good',
      assertion: 'toBeFaithful',
      usage: { model: 'gpt-4o' }
    });

    const result = await evaliphyExpect(input).toBeFaithful({
      returnResult: true,
    });

    expect(result).toEqual({
      pass: true,
      score: 0.9,
      reason: 'Good',
      modelResults: [
        {
          model: 'gpt-4o',
          score: 0.9,
          pass: true,
          reason: 'Good',
        },
      ],
    });
  });

  it('should throw if response is empty', async () => {
    await expect(
      evaliphyExpect("").toBeCoherent()
    ).rejects.toThrow('requires a non-empty response');
  });

  it('should throw if query is missing for toBeFaithful', async () => {
    const input: any = { response: "res", context: "ctx" };
    await expect(
      evaliphyExpect(input).toBeFaithful()
    ).rejects.toThrow('toBeFaithful requires non-empty query, context, and response');
  });

  it('should throw if query is missing for toBeRelevant', async () => {
    const input: any = { response: "res" };
    await expect(
      evaliphyExpect(input).toBeRelevant()
    ).rejects.toThrow('toBeRelevant requires non-empty query and response');
  });

  it('should throw if context is missing for toBeGrounded', async () => {
    const input: any = { response: "res" };
    await expect(
      evaliphyExpect(input).toBeGrounded()
    ).rejects.toThrow('toBeGrounded requires non-empty context and response');
  });

  it('should throw if response is empty for RAG assertions', async () => {
    const input: any = { query: "q", context: "c", response: "" };
    await expect(
      evaliphyExpect(input).toBeFaithful()
    ).rejects.toThrow('toBeFaithful requires non-empty query, context, and response');
  });

  it('should support .not negation', async () => {
    (AssertionEngine.run as any).mockResolvedValue({
      passed: true, // LLM says it IS coherent
      score: 1.0,
      reason: 'Logical',
      assertion: 'toBeCoherent',
    });

    // Since it IS coherent, .not.toBeCoherent() should fail
    await expect(
      evaliphyExpect("Coherent text").not.toBeCoherent({ continueOnFailure: false })
    ).rejects.toThrow('✗ toBeCoherent failed');
  });

  it('should support .not negation for RAG assertions', async () => {
    (AssertionEngine.run as any).mockResolvedValue({
      passed: true,
      score: 1.0,
      reason: 'Faithful',
      assertion: 'toBeFaithful',
    });

    await expect(
      evaliphyExpect({
        query: "q",
        context: "c",
        response: "r"
      }).not.toBeFaithful({ continueOnFailure: false })
    ).rejects.toThrow('✗ toBeFaithful failed');
  });
});
