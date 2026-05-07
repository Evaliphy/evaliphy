import { getConfig } from '@evaliphy/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expect as evaliphyExpect } from '../../src/expect/expect.js';
import { updateGlobalResult } from '../../src/expect/expectUtil.js';

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

vi.mock('../../src/expect/expectUtil.js', async () => {
  const actual = await vi.importActual('../../src/expect/expectUtil.js');
  return {
    ...actual,
    updateGlobalResult: vi.fn(),
  };
});

describe('Deterministic Assertions', () => {
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
  });

  describe('toContain', () => {
    it('should pass when string contains expected substring', () => {
      evaliphyExpect("Hello world").toContain("world");
      
      expect(updateGlobalResult).toHaveBeenCalledWith(
        'toContain',
        expect.objectContaining({
          passed: true,
          score: 1,
          assertionName: 'toContain',
          type: 'deterministic'
        }),
        expect.anything()
      );
    });

    it('should fail when string does not contain expected substring (soft)', () => {
      evaliphyExpect("Hello world").toContain("missing");
      
      expect(updateGlobalResult).toHaveBeenCalledWith(
        'toContain',
        expect.objectContaining({
          passed: false,
          score: 0,
          assertionName: 'toContain'
        }),
        expect.anything()
      );
    });

    it('should throw DeterministicAssertionError when failFast is true', () => {
      (getConfig as any).mockReturnValue({
        llmAsJudgeConfig: { provider: 'openai' },
        deterministicConfig: { failFast: true }
      });

      expect(() => {
        evaliphyExpect("Hello world").toContain("missing");
      }).toThrow(); // It should throw DeterministicAssertionError
    });

    it('should support custom message', () => {
      evaliphyExpect("Hello world", "Custom failure message").toContain("missing");
      
      expect(updateGlobalResult).toHaveBeenCalledWith(
        'toContain',
        expect.objectContaining({
          message: "Custom failure message"
        }),
        expect.anything()
      );
    });

    it('should support .not negation', () => {
      evaliphyExpect("Hello world").not.toContain("missing");
      
      expect(updateGlobalResult).toHaveBeenCalledWith(
        'toContain',
        expect.objectContaining({
          passed: true,
          score: 1
        }),
        expect.anything()
      );

      evaliphyExpect("Hello world").not.toContain("world");
      
      expect(updateGlobalResult).toHaveBeenCalledWith(
        'toContain',
        expect.objectContaining({
          passed: false,
          score: 0
        }),
        expect.anything()
      );
    });
  });
});
