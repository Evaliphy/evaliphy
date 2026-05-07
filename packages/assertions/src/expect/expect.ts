import { createLLMClient } from "@evaliphy/ai";
import type { ILLMClient } from '@evaliphy/core';
import { ConfigLoader, EvaliphyError, EvaliphyErrorCode, getConfig } from '@evaliphy/core';
import type { AssertionContext, EvalInput, RagAssertions, TextAssertions } from '../engine/types.js';
import { MatcherChain } from './MatcherChain.js';

/**
 * Creates an expectation for a given LLM response string.
 * Returns assertions that only require the response.
 */
export function expect(response: string, message?: string): TextAssertions;

/**
 * Creates an expectation for a full RAG sample (query, context, response).
 * Returns all available assertions including RAG-specific ones.
 */
export function expect(query: string, context: string | string[], response: string, message?: string): RagAssertions;

/**
 * Creates an expectation for a full evaluation input object.
 * Returns all available assertions.
 */
export function expect<T extends EvalInput = EvalInput>(input: T, message?: string): RagAssertions;

/**
 * Implementation of the expect function.
 */
export function expect(
  first: string | EvalInput,
  second?: string | string[] | string,
  third?: string,
  fourth?: string
): TextAssertions | RagAssertions {
  let evalInput: EvalInput;
  let customMessage: string | undefined;

  if (typeof first === 'string') {
    if (typeof second === 'string' && third !== undefined && fourth !== undefined) {
        // Positional arguments: query, context, response, message
        evalInput = {
          query: first,
          context: second,
          response: third
        };
        customMessage = fourth;
    } else if (Array.isArray(second) && third !== undefined) {
        // Positional arguments: query, context (array), response, message (optional)
        evalInput = {
          query: first,
          context: second,
          response: third
        };
        customMessage = fourth;
    } else if (second !== undefined && third !== undefined) {
      // Positional arguments: query, context, response
      evalInput = {
        query: first,
        context: second as string | string[],
        response: third
      };
      customMessage = fourth;
    } else {
      // Single string argument: response, message (optional)
      evalInput = { response: first };
      customMessage = second as string;
    }
  } else {
    // Object argument: EvalInput, message (optional)
    evalInput = first;
    customMessage = second as string;
  }

  // Get config from execution context (AsyncLocalStorage)
  const config = getConfig() || (ConfigLoader.getInstance() as any).cachedConfig || {};
  
  if (!config.llmAsJudgeConfig) {
      throw new EvaliphyError(
          EvaliphyErrorCode.INVALID_CONFIG,
          "llmAsJudgeConfig is required for assertions. Make sure it is defined in your config file."
      );
  }

  let llmClient: ILLMClient;
  try {
    llmClient = createLLMClient(config.llmAsJudgeConfig);
  } catch (error) {
    llmClient = {
      generateObject: async () => { throw error; },
      generateText: async () => { throw error; },
    } as unknown as ILLMClient;
  }

  const context: AssertionContext = {
    input: evalInput,
    options: {},
    llmClient,
    config,
  };

  return new MatcherChain(context, false, customMessage);
}
