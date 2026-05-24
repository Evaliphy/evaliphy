import { EvaliphyError, EvaliphyErrorCode } from '@evaliphy/core';
import type { BaseMatcher } from '../matchers/base/BaseMatcher.js';
import { PromptLoader } from '../promptManager/promptLoader.js';
import { PromptRenderer } from '../promptManager/promptRenderer.js';
import { assertionRegistry } from "../registry.js";
import { type AssertionContext, type AssertionResult } from './types.js';

export class AssertionEngine {
  /**
   * Runs the assertion logic, executing an LLM call if the matcher requires it.
   */
  static async run(
    matcher: BaseMatcher,
    context: AssertionContext
  ): Promise<AssertionResult> {
    const startTime = Date.now();
    const { input, options, llmClient } = context;

    try {
      matcher.validate(input);

      let score = 0;
      let reason = '';
      let usage: AssertionResult['usage'] = undefined;
      const usedLLM = matcher.usesLLM;

      if (usedLLM) {
        const { finalPrompt, outputSchema } = this.prepareLLMRequest(matcher, context);
        const response = await this.executeLLMCall(matcher, llmClient, finalPrompt, outputSchema);

        const parsed = response.object as { score: number; reason: string };
        score = parsed.score;
        reason = parsed.reason;
        usage = response.llmUsages;
      }

      const threshold = options.threshold ?? 0.7;
      const passed = score >= threshold;

      return {
        assertion: matcher.name,
        passed,
        score,
        reason,
        threshold,
        usedLLM,
        usage,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof EvaliphyError) throw error;
      throw new EvaliphyError(
        EvaliphyErrorCode.ASSERTION_FAILED,
        `${matcher.name}: Assertion failed`,
        "Failed with threshold check",
        error as Error
      );
    }
  }

  /**
   * Prepares the LLM prompt and schema for the assertion.
   * Centralizes prompt loading through PromptLoader.
   */
  private static prepareLLMRequest(matcher: BaseMatcher, context: AssertionContext) {
    const { input, config } = context;
    const assertionDef = assertionRegistry[matcher.name];

    if (!assertionDef) {
      throw new EvaliphyError(
        EvaliphyErrorCode.INTERNAL_ERROR,
        `Assertion "${matcher.name}" is not registered in the assertion registry.`
      );
    }

    // Call the centralized PromptLoader to handle path resolution and loading
    const loadedPrompt = PromptLoader.resolveAndLoad(matcher.name, assertionDef, config);
    const variables = this.prepareVariables(input);
    const finalPrompt = PromptRenderer.render(loadedPrompt.template, variables, assertionDef);
    const outputSchema = assertionDef.outputSchema.zodSchema as any;

    return { finalPrompt, outputSchema };
  }

  /**
   * Prepares the variables for the prompt renderer.
   */
  private static prepareVariables(input: any) {
    return {
      ...Object.fromEntries(
        Object.entries(input).filter(([_, v]) => typeof v === 'string')
      ),
      response: input.response,
      question: input.query || '',
      context: Array.isArray(input.context) ? input.context.join('\n\n') : (input.context || ''),
    } as Record<string, string>;
  }

  /**
   * Executes the actual LLM call using the provided client.
   */
  private static async executeLLMCall(matcher: BaseMatcher, llmClient: any, prompt: string, schema: any) {
    try {
      return await llmClient.generateObject(prompt, schema);
    } catch (error: any) {
      throw new EvaliphyError(
        EvaliphyErrorCode.ASSERTION_LLM_FAILED,
        `${matcher.name}: Failed to connect to LLM Judge. Check your llmAsJudgeConfig and API key.`,
        'Check your llmAsJudge config and API key',
        error
      );
    }
  }
}
