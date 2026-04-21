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

  /** Asserts the value does NOT contain the expected substring. */
  toNotContain(expected: string): DeterministicAssertionResult {
    const start = Date.now();
    const passed = !this.value.includes(expected);
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value does not contain "${expected}"` : `Value unexpectedly contains "${expected}"`,
      message: this.message, assertionName: 'toNotContain', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value contains ALL of the provided substrings. */
  toContainAll(expected: string[]): DeterministicAssertionResult {
    const start = Date.now();
    const missing = expected.filter((s) => !this.value.includes(s));
    const passed = missing.length === 0;
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value contains all expected substrings` : `Value is missing: ${missing.map((s) => `"${s}"`).join(', ')}`,
      message: this.message, assertionName: 'toContainAll', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value contains AT LEAST ONE of the provided substrings. */
  toContainAny(expected: string[]): DeterministicAssertionResult {
    const start = Date.now();
    const passed = expected.some((s) => this.value.includes(s));
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value contains at least one expected substring` : `Value contains none of: ${expected.map((s) => `"${s}"`).join(', ')}`,
      message: this.message, assertionName: 'toContainAny', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value matches the given regular expression. */
  toMatchRegex(pattern: RegExp): DeterministicAssertionResult {
    const start = Date.now();
    const passed = pattern.test(this.value);
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value matches pattern ${pattern}` : `Value does not match pattern ${pattern}`,
      message: this.message, assertionName: 'toMatchRegex', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value's length is at least `min` characters. */
  toHaveMinLength(min: number): DeterministicAssertionResult {
    const start = Date.now();
    const passed = this.value.length >= min;
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value length ${this.value.length} meets minimum of ${min}` : `Value length ${this.value.length} is below minimum of ${min}`,
      message: this.message, assertionName: 'toHaveMinLength', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value's length does not exceed `max` characters. */
  toHaveMaxLength(max: number): DeterministicAssertionResult {
    const start = Date.now();
    const passed = this.value.length <= max;
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value length ${this.value.length} does not exceed maximum of ${max}` : `Value length ${this.value.length} exceeds maximum of ${max}`,
      message: this.message, assertionName: 'toHaveMaxLength', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
    return result;
  }

  /** Asserts the value's length is between `min` and `max` characters (inclusive). */
  toHaveLengthBetween(min: number, max: number): DeterministicAssertionResult {
    const start = Date.now();
    const len = this.value.length;
    const passed = len >= min && len <= max;
    const durationMs = Date.now() - start;
    const result: DeterministicAssertionResult = {
      passed, score: passed ? 1 : 0,
      reason: passed ? `Value length ${len} is within [${min}, ${max}]` : `Value length ${len} is outside the range [${min}, ${max}]`,
      message: this.message, assertionName: 'toHaveLengthBetween', type: 'deterministic', durationMs,
    };
    if (!passed) throw new DeterministicAssertionError(result, this.value);
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
