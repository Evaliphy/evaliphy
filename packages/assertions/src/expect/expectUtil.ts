import { getResult } from '@evaliphy/core';
import type { AssertionContext, AssertionOptions, AssertionResult, EvalInput, EvalResult } from '../engine/types.js';

/**
 * Merges assertion-specific options with the base context options.
 */
export function mergeOptions(context: AssertionContext, options?: AssertionOptions): AssertionContext {
  return {
    ...context,
    options: { ...context.options, ...options },
  };
}

/**
 * Updates the global run result with the outcome of an assertion.
 */
export function updateGlobalResult(matcherName: string, result: AssertionResult | any, input: EvalInput): void {
  const runResult = getResult();
  if (runResult) {
    if (result.type === 'deterministic') {
      runResult.assertions.push({
        name: matcherName,
        score: result.score,
        passed: result.passed,
        reason: result.reason,
        durationMs: result.durationMs,
        llmTokens: 0,
        model: 'deterministic',
      });
    } else {
      const res = result as AssertionResult;
      runResult.assertions.push({
        name: matcherName,
        score: res.score,
        passed: res.passed,
        reason: res.reason,
        threshold: res.threshold,
        durationMs: res.duration,
        llmTokens: res.usage?.totalTokens || 0,
        model: res.usage?.model,
      });
    }
    
    if ('query' in input && input.query && !runResult.inputs.query) {
      runResult.inputs.query = (input.query as string);
    }
    
    if ('context' in input && input.context && !runResult.inputs.context) {
      runResult.inputs.context = (Array.isArray(input.context) ? input.context.join('\n\n') : (input.context as string));
    }
    
    if (input.response && !runResult.inputs.response) {
      runResult.inputs.response = input.response;
    }
  }
}

/**
 * Applies negation logic to an assertion result if needed.
 */
export function applyNegation(result: AssertionResult, isNot: boolean): void {
  if (isNot) {
    result.passed = !result.passed;
    result.reason = `[NOT] ${result.reason}`;
  }
}

/**
 * Builds a standardized EvalResult from an AssertionResult.
 */
export function buildEvalResult(result: AssertionResult): EvalResult {
  return {
    pass: result.passed,
    score: result.score,
    reason: result.reason,
    modelResults: [
      {
        model: result.usage?.model || 'unknown',
        score: result.score,
        pass: result.passed,
        reason: result.reason,
      },
    ],
  };
}

/**
 * Throws a formatted error message for a failed assertion.
 */
export function handleAssertionFailure(
  result: AssertionResult,
  evalResult: EvalResult,
  input: EvalInput,
  options: AssertionOptions = {},
  config: any = {}
): void {
  if (!result.passed) {
    // Default to true if not specified in options or config
    const continueOnFailure = options.continueOnFailure ?? config.llmAsJudgeConfig?.continueOnFailure ?? true;

    if (continueOnFailure) {
      return;
    }

    const queryPart = 'query' in input && input.query ? [
      '',
      '  Query:',
      `    "${input.query}"`,
    ] : [];

    const message = [
      `✗ ${result.assertion} failed:`,
      ...queryPart,
      '',
      '  Response:',
      `    "${input.response}"`,
      '',
      `  Reason (${evalResult.modelResults[0].model}):`,
      `    "${result.reason}"`,
      '',
      '  Models:',
      `    - ${evalResult.modelResults[0].model}: ${result.passed ? '✓' : '✗'} (score ${result.score})`,
    ].join('\n');
    
    throw new Error(message);
  }
}
