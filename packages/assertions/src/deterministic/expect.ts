import { DeterministicAssertionError } from './DeterministicAssertionError.js';
import type { DeterministicAssertionResult } from './types.js';

/**
 * Chainable matcher for deterministic (non-LLM) assertions.
 * All methods are synchronous and throw {@link DeterministicAssertionError} on failure.
 */
export class DeterministicMatcherChain {
  constructor(
    private readonly value: string,
    private readonly message?: string,
  ) {}

  /**
   * Asserts that the value contains the expected substring.
   *
   * @param expected - The substring that must be present in the value.
   * @returns The {@link DeterministicAssertionResult} (for programmatic inspection).
   * @throws {DeterministicAssertionError} When the value does not contain the expected substring.
   *
   * @example
   * deterministicExpect("You can return items within 30 days.").toContain("30 days");
   *
   * @example
   * deterministicExpect(
   *   "You can return items within 30 days.",
   *   "Response should mention return window"
   * ).toContain("30 days");
   */
  toContain(expected: string): DeterministicAssertionResult {
    const start = Date.now();
    const passed = this.value.includes(expected);
    const durationMs = Date.now() - start;

    const result: DeterministicAssertionResult = {
      passed,
      score: passed ? 1 : 0,
      reason: passed
        ? `Value contains "${expected}"`
        : `Value does not contain "${expected}"`,
      message: this.message,
      assertionName: 'toContain',
      type: 'deterministic',
      durationMs,
    };

    if (!passed) {
      throw new DeterministicAssertionError(result, this.value);
    }

    return result;
  }
}

/**
 * Creates a deterministic expectation for a string value.
 * Unlike the LLM-based {@link expect}, this is fully synchronous and requires no judge configuration.
 *
 * @param value   - The string value to assert on.
 * @param message - Optional human-readable label shown in the report when the assertion fails.
 * @returns A {@link DeterministicMatcherChain} to perform assertions.
 *
 * @example
 * deterministicExpect("You can return items within 30 days.").toContain("30 days");
 *
 * @example
 * deterministicExpect(
 *   "You can return items within one month.",
 *   "Response should mention return window"
 * ).toContain("30 days");
 * // throws DeterministicAssertionError:
 * //   Response should mention return window
 * //
 * //   toContain failed
 * //   ...
 */
export function deterministicExpect(value: string, message?: string): DeterministicMatcherChain {
  return new DeterministicMatcherChain(value, message);
}
