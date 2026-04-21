import { createLLMClient } from "@evaliphy/ai";
import type { ILLMClient } from '@evaliphy/core';
import { ConfigLoader, EvaliphyError, EvaliphyErrorCode, getConfig } from '@evaliphy/core';
import { AssertionEngine } from '../engine/AssertionEngine.js';
import type { AssertionContext, AssertionOptions, EvalInput, EvalResult, RagSample } from '../engine/types.js';
import type { BaseMatcher } from '../matchers/base/BaseMatcher.js';
import { ToBeCoherentMatcher } from '../matchers/core/toBeCoherent.js';
import { ToBeFaithfulMatcher } from '../matchers/core/toBeFaithful.js';
import { ToBeGroundedMatcher } from '../matchers/core/toBeGrounded.js';
import { ToBeHarmlessMatcher } from '../matchers/core/toBeHarmless.js';
import { ToBeRelevantMatcher } from '../matchers/core/toBeRelevant.js';
import { applyNegation, buildEvalResult, handleAssertionFailure, mergeOptions, updateGlobalResult } from './expectUtil.js';

/**
 * Assertions that only require a response string.
 */
export interface TextAssertions {
  /**
   * Negates the next assertion in the chain.
   */
  not: TextAssertions;

  /**
   * Asserts that the response is logically consistent and easy to follow.
   */
  toBeCoherent(options?: AssertionOptions): Promise<EvalResult | void>;

  /**
   * Asserts that the response contains no toxic, harmful, or biased content.
   */
  toBeHarmless(options?: AssertionOptions): Promise<EvalResult | void>;
}

/**
 * Assertions that require the full RAG triad (query, response, context).
 */
export interface RagAssertions extends TextAssertions {
  /**
   * Negates the next assertion in the chain.
   */
  not: RagAssertions;

  /**
   * Asserts that the response is faithful to the provided context.
   */
  toBeFaithful(options?: AssertionOptions): Promise<EvalResult | void>;

  /**
   * Asserts that the response directly addresses the user's query.
   */
  toBeRelevant(options?: AssertionOptions): Promise<EvalResult | void>;

  /**
   * Asserts that the response is supported by the provided context.
   */
  toBeGrounded(options?: AssertionOptions): Promise<EvalResult | void>;
}

/**
 * Internal implementation of the matcher chain.
 */
class MatcherChain implements RagAssertions {
  constructor(
    private context: AssertionContext,
    private isNot: boolean = false
  ) {}

  get not(): MatcherChain {
    return new MatcherChain(this.context, !this.isNot);
  }

  async toBeFaithful(options?: AssertionOptions): Promise<EvalResult | void> {
    const matcher = new ToBeFaithfulMatcher();
    const input = this.context.input as RagSample;

    if (!input.query || !input.context || !input.response ||
        input.query.trim() === '' || input.response.trim() === '' ||
        (Array.isArray(input.context) ? input.context.length === 0 : input.context.trim() === '')) {
      throw new EvaliphyError(
        EvaliphyErrorCode.INVALID_ASSERTION_INPUT,
        "toBeFaithful requires non-empty query, context, and response. Provide them in the expect() input."
      );
    }

    return this.runAssertion(matcher, options);
  }

  async toBeRelevant(options?: AssertionOptions): Promise<EvalResult | void> {
    const matcher = new ToBeRelevantMatcher();
    const input = this.context.input as RagSample;

    if (!input.query || !input.response || input.query.trim() === '' || input.response.trim() === '') {
      throw new EvaliphyError(
        EvaliphyErrorCode.INVALID_ASSERTION_INPUT,
        "toBeRelevant requires non-empty query and response. Provide them in the expect() input."
      );
    }

    return this.runAssertion(matcher, options);
  }

  async toBeGrounded(options?: AssertionOptions): Promise<EvalResult | void> {
    const matcher = new ToBeGroundedMatcher();
    const input = this.context.input as RagSample;

    if (!input.context || !input.response || input.response.trim() === '' ||
        (Array.isArray(input.context) ? input.context.length === 0 : input.context.trim() === '')) {
      throw new EvaliphyError(
        EvaliphyErrorCode.INVALID_ASSERTION_INPUT,
        "toBeGrounded requires non-empty context and response. Provide them in the expect() input."
      );
    }

    return this.runAssertion(matcher, options);
  }

  async toBeCoherent(options?: AssertionOptions): Promise<EvalResult | void> {
    return this.runAssertion(new ToBeCoherentMatcher(), options);
  }

  async toBeHarmless(options?: AssertionOptions): Promise<EvalResult | void> {
    return this.runAssertion(new ToBeHarmlessMatcher(), options);
  }

  /**
   * Internal helper to run an assertion through the engine.
   */
  private async runAssertion(matcher: BaseMatcher, options?: AssertionOptions): Promise<EvalResult | void> {
    const input = this.context.input;

    if (!input.response || input.response.trim().length === 0) {
        throw new EvaliphyError(
            EvaliphyErrorCode.INVALID_ASSERTION_INPUT,
            `Assertion ${matcher.name} requires a non-empty response.`
        );
    }

    const contextWithMergedOptions = mergeOptions(this.context, options);
    const result = await AssertionEngine.run(matcher, contextWithMergedOptions);
    
    updateGlobalResult(matcher.name, result, input);
    applyNegation(result, this.isNot);

    const evalResult = buildEvalResult(result);

    if (contextWithMergedOptions.options.returnResult) {
      return evalResult;
    }

    handleAssertionFailure(result, evalResult, input, contextWithMergedOptions.options, this.context.config);
  }
}

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
