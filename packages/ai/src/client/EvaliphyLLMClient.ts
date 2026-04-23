import {
  generateText,
  Output,
  LanguageModel,
} from 'ai';
import { EvaliphyError, EvaliphyErrorCode, ILLMClient, LLMJudgeConfig, LLMObjectResponse, LLMResponse, LLMUsage, logger } from '@evaliphy/core';
import { z } from 'zod';


export class EvaliphyLLMClient implements ILLMClient {
  constructor(
    private readonly model: LanguageModel,
    private readonly config: LLMJudgeConfig
  ) {}

  async generate(prompt: string): Promise<LLMResponse> {
    logger.debug({ model: this.config.model, provider: this.config.provider.type, prompt }, 'Generating text');
    const start = Date.now();
    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: this.config.temperature,
        abortSignal: this.config.timeout
          ? AbortSignal.timeout(this.config.timeout)
          : undefined,
      });
      const durationMs = Date.now() - start;

      const usage: LLMUsage = {
        totalTokens: result.usage.totalTokens ?? 0,
        model: this.config.model,
        provider: this.config.provider.type,
        durationMs,
      };

      logger.debug({ usage, response: result.text }, 'Text generation successful');

      return {
        response: result.text,
        llmUsages: usage,
        model: this.config.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ model: this.config.model, provider: this.config.provider.type, error: errorMessage }, 'Text generation failed');
      logger.debug({ error }, 'Full error details');
      throw this.handleError(error);
    }
  }

  async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<LLMObjectResponse<T>> {
    logger.debug({ model: this.config.model, provider: this.config.provider.type, prompt }, 'Generating object');
    const start = Date.now();
    try {
      const result = await generateText({
        model: this.model,
        prompt,
        output: Output.object({ schema }),
        temperature: this.config.temperature,
        // Note: maxTokens is not supported in the Output.object overload of generateText
        abortSignal: this.config.timeout
          ? AbortSignal.timeout(this.config.timeout)
          : undefined,
      });
      const durationMs = Date.now() - start;

      const usage: LLMUsage = {
        totalTokens: result.usage.totalTokens ?? 0,
        model: this.config.model,
        provider: this.config.provider.type,
        durationMs,
      };

      logger.debug({ usage, object: result.output }, 'Object generation successful');

      return {
        object: result.output as T,
        llmUsages: usage,
        model: this.config.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ model: this.config.model, provider: this.config.provider.type, error: errorMessage }, 'Object generation failed');
      logger.debug({ errorMessage, error }, 'Full error details');
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error instanceof EvaliphyError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('api key') ||
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('401')
    ) {
      return new EvaliphyError(
        EvaliphyErrorCode.LLM_AUTHENTICATION_ERROR,
        `Authentication failed for provider ${this.config.provider.type}`,
        `Please check if your API key for ${this.config.provider.type} is correct and has sufficient permissions.`,
        error
      );
    }

    return new EvaliphyError(
      EvaliphyErrorCode.LLM_GENERIC_ERROR,
      `LLM request failed: ${message}. This might be due to network issues, rate limits, or provider downtime. Check the provider's status page.`,
      `This might be due to network issues, rate limits, or provider downtime. Check the provider's status page.`,
      error
    );
  }
}
