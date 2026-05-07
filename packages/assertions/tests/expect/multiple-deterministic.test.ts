import { getConfig, getResult } from '@evaliphy/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expect as evaliphyExpect } from '../../src/expect/expect.js';

vi.mock('@evaliphy/ai', () => ({
  createLLMClient: vi.fn().mockReturnValue({
    generateObject: vi.fn(),
    generateText: vi.fn(),
  }),
}));

vi.mock('@evaliphy/core', async () => {
  const actual = await vi.importActual('@evaliphy/core');
  return {
    ...actual,
    getConfig: vi.fn(),
    getResult: vi.fn(),
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

describe('Deterministic Assertions - Multiple Reproduction', () => {
  let mockResult: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (getConfig as any).mockReturnValue({
      llmAsJudgeConfig: {
        provider: 'openai',
        apiKey: 'test-key',
      },
      deterministicConfig: {
        failFast: false
      }
    });

    mockResult = {
      assertions: [],
      inputs: { query: '', context: '', response: '' }
    };
    (getResult as any).mockReturnValue(mockResult);
  });

  it('should record both passing and failing assertions in the array', () => {
    const response = "processed after the warehouse confirms";
    
    // First one passes
    evaliphyExpect(response).toContain("warehouse");
    // Second one fails (but failFast is false)
    evaliphyExpect(response).toContain("it should fail");

    expect(mockResult.assertions).toHaveLength(2);
    expect(mockResult.assertions[0].name).toBe('toContain');
    expect(mockResult.assertions[0].passed).toBe(true);
    
    expect(mockResult.assertions[1].name).toBe('toContain');
    expect(mockResult.assertions[1].passed).toBe(false);
  });

  it('should record multiple assertions even if the first one fails and throws', () => {
    (getConfig as any).mockReturnValue({
      llmAsJudgeConfig: { provider: 'openai' },
      deterministicConfig: { failFast: true }
    });

    try {
        evaliphyExpect("hello").toContain("fail");
    } catch (e) {
        // Expected
    }

    expect(mockResult.assertions).toHaveLength(1);
    expect(mockResult.assertions[0].passed).toBe(false);
  });
});
