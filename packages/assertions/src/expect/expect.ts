import { createLLMClient } from "@evaliphy/ai";
import type { ILLMClient } from '@evaliphy/core';
import { ConfigLoader, EvaliphyError, EvaliphyErrorCode, getConfig } from '@evaliphy/core';
import type { AssertionContext, EvalInput, RagAssertions, TextAssertions } from '../engine/types.js';
import { MatcherChain } from './MatcherChain.js';

/**
 * Creates an expectation for a given LLM response string.
 * Returns assertions that only require the response.
 */
export function expect(response: string): TextAssertions;

/**
 * Creates an expectation for a full RAG sample (query, context, response).
 * Returns all available assertions including RAG-specific ones.
 */
export function expect(query: string, context: string | string[], response: string): RagAssertions;

/**
 * Creates an expectation for a full evaluation input object.
 * Returns all available assertions.
 */
export function expect<T extends EvalInput = EvalInput>(input: T): RagAssertions;

/**
 * Implementation of the expect function.
 */
export function expect(
  first: string | EvalInput,
  second?: string | string[],
  third?: string
): TextAssertions | RagAssertions {
  let evalInput: EvalInput;

  if (typeof first === 'string') {
    if (second !== undefined && third !== undefined) {
      // Positional arguments: query, context, response
      evalInput = {
        query: first,
        context: second,
        response: third
      };
    } else {
      // Single string argument: response
      evalInput = { response: first };
    }
  } else {
    // Object argument: EvalInput
    evalInput = first;
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

  return new MatcherChain(context);
}
