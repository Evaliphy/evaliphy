import { LanguageModel } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { EvaliphyLLMClient } from '../../src/client/EvaliphyLLMClient.js';
import {EvaliphyErrorCode, LLMJudgeConfig, logger} from "@evaliphy/core";

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'mocked response',
    output: { result: 'mocked object' },
    usage: { totalTokens: 10 },
  }),
  Output: {
    object: vi.fn().mockReturnValue({ type: 'object' }),
  },
}));

vi.mock('@evaliphy/core', async () => {
  const actual = await vi.importActual('@evaliphy/core') as any;
  return {
    ...actual,
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

describe('EvaliphyLLMClient', () => {
  let mockModel: LanguageModel;
  let mockConfig: LLMJudgeConfig;
  let client: EvaliphyLLMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockModel = {} as LanguageModel;
    mockConfig = {
      model: 'gpt-4',
      provider: { type: 'openai' },
      temperature: 0.7,
    } as LLMJudgeConfig;
    client = new EvaliphyLLMClient(mockModel, mockConfig);
  });

  it('should log debug messages during generate', async () => {
    const response = await client.generate('test prompt');

    expect(response.response).toBe('mocked response');
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'test prompt' }),
      'Generating text'
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ response: 'mocked response' }),
      'Text generation successful'
    );
  });

  it('should log error message and wrap in EvaliphyError when generate fails', async () => {
    const { generateText } = await import('ai');
    (generateText as any).mockRejectedValueOnce(new Error('API Error'));

    await expect(client.generate('test prompt')).rejects.toThrow(/LLM request failed: API Error/);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4' }),
      'Text generation failed'
    );
  });

  it('should log debug messages during generateObject', async () => {
    const schema = z.object({ result: z.string() });
    const response = await client.generateObject('test prompt', schema);

    expect(response.object).toEqual({ result: 'mocked object' });
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'test prompt' }),
      'Generating object'
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ object: { result: 'mocked object' } }),
      'Object generation successful'
    );
  });

  it('should log error message and wrap in EvaliphyError when generateObject fails', async () => {
    const { generateText } = await import('ai');
    (generateText as any).mockRejectedValueOnce(new Error('Schema Error'));

    const schema = z.object({ result: z.string() });
    await expect(client.generateObject('test prompt', schema)).rejects.toThrow(/LLM request failed: Schema Error/);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4' }),
      'Object generation failed'
    );
  });

  it('should report specific authentication error', async () => {
    const { generateText } = await import('ai');
    (generateText as any).mockRejectedValueOnce(new Error('Unauthorized: Invalid API Key'));

    try {
      await client.generate('test prompt');
    } catch (error: any) {
      expect(error.code).toBe(EvaliphyErrorCode.LLM_AUTHENTICATION_ERROR);
      expect(error.message).toContain('Authentication failed');
      expect(error.hint).toContain('API key');
    }
  });
});
