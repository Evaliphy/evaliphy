import { EvaliphyError, EvaliphyErrorCode } from '@evaliphy/core';
import { AssertionEngine } from '../engine/AssertionEngine.js';
import type { AssertionContext, AssertionOptions, EvalResult, RagAssertions, RagSample } from '../engine/types.js';
import type { BaseMatcher } from '../matchers/base/BaseMatcher.js';
import { ToBeCoherentMatcher } from '../matchers/core/toBeCoherent.js';
import { ToBeFaithfulMatcher } from '../matchers/core/toBeFaithful.js';
import { ToBeGroundedMatcher } from '../matchers/core/toBeGrounded.js';
import { ToBeHarmlessMatcher } from '../matchers/core/toBeHarmless.js';
import { ToBeRelevantMatcher } from '../matchers/core/toBeRelevant.js';
import { applyNegation, buildEvalResult, handleAssertionFailure, mergeOptions, updateGlobalResult } from './expectUtil.js';

/**
 * Internal implementation of the matcher chain.
 */
export class MatcherChain implements RagAssertions {
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

    this.validateRagInput(input, 'toBeFaithful');

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

  private validateRagInput(input: RagSample, matcherName: string): void {
    if (!input.query || !input.context || !input.response ||
        input.query.trim() === '' || input.response.trim() === '' ||
        (Array.isArray(input.context) ? input.context.length === 0 : input.context.trim() === '')) {
      throw new EvaliphyError(
        EvaliphyErrorCode.INVALID_ASSERTION_INPUT,
        `${matcherName} requires non-empty query, context, and response. Provide them in the expect() input.`
      );
    }
  }
}
