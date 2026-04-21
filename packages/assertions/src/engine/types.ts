import type { EvaliphyConfig, ILLMClient } from '@evaliphy/core';
import { z } from 'zod';

export interface EvalInput {
  response: string;
  query?: string;
  context?: string | string[];
  history?: Array<{ role: string; content: string }>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Input for RAG-related evaluations.
 * Requires the "RAG Triad": query, response, and context.
 */
export interface RagSample extends EvalInput {
  query: string;
  response: string;
  context: string | string[];
}

/**
 * Input for query-based evaluations that don't necessarily need context.
 */
export interface QuerySample extends EvalInput {
  query: string;
}

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

export interface EvalResult {
  pass: boolean;
  score?: number;
  reason: string;
  modelResults: Array<{
    model: string;
    score?: number;
    pass: boolean;
    reason: string;
  }>;
}

export interface AssertionResult {
  assertion: string;
  passed: boolean;
  score: number;
  reason: string;
  threshold: number;
  usedLLM: boolean;
  usage?: {
    totalTokens: number;
    model: string;
    provider: string;
    durationMs: number;
  };
  duration: number;
}

/**
 * Configuration for assertion.
 */
export interface AssertionOptions {
  threshold?: number;
  model?: string;
  debug?: boolean;
  promptVersion?: string;
  returnResult?: boolean;
  /**
   * Whether to continue test execution even if this assertion fails.
   * Overrides global `llmAsJudgeConfig.continueOnFailure`.
   */
  continueOnFailure?: boolean;
}

export interface AssertionContext {
  input: EvalInput;
  options: AssertionOptions;
  llmClient: ILLMClient;
  config: EvaliphyConfig;
}


export const JudgeResponseSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  reason: z.string(),
});
