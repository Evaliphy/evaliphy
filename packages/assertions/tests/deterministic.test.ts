import { describe, expect, it } from 'vitest';
import { DeterministicAssertionError } from '../src/deterministic/DeterministicAssertionError.js';
import { deterministicExpect } from '../src/deterministic/expect.js';

describe('deterministicExpect', () => {
  describe('toContain — passing cases', () => {
    it('returns a passing result when value contains expected', () => {
      const result = deterministicExpect(
        'You can return items within 30 days.'
      ).toContain('30 days');

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
      expect(result.assertionName).toBe('toContain');
      expect(result.type).toBe('deterministic');
      expect(result.message).toBeUndefined();
    });

    it('result includes durationMs', () => {
      const result = deterministicExpect('hello world').toContain('hello');
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('forwards optional message into result', () => {
      const result = deterministicExpect(
        'Response mentions 30 days.',
        'Should mention return window'
      ).toContain('30 days');

      expect(result.message).toBe('Should mention return window');
    });
  });

  describe('toContain — failing cases', () => {
    it('throws DeterministicAssertionError when value does not contain expected', () => {
      expect(() =>
        deterministicExpect('You can return items within one month.').toContain('30 days')
      ).toThrow(DeterministicAssertionError);
    });

    it('error has a passing=false result attached', () => {
      let caught: DeterministicAssertionError | undefined;
      try {
        deterministicExpect('one month').toContain('30 days');
      } catch (e) {
        caught = e as DeterministicAssertionError;
      }

      expect(caught).toBeDefined();
      expect(caught!.result.passed).toBe(false);
      expect(caught!.result.score).toBe(0);
      expect(caught!.result.assertionName).toBe('toContain');
      expect(caught!.result.type).toBe('deterministic');
    });

    it('error message contains expected and received values', () => {
      let caught: DeterministicAssertionError | undefined;
      try {
        deterministicExpect(
          'You can return items within one month.',
          'Response should mention return window'
        ).toContain('30 days');
      } catch (e) {
        caught = e as DeterministicAssertionError;
      }

      expect(caught).toBeDefined();
      expect(caught!.message).toContain('Response should mention return window');
      expect(caught!.message).toContain('toContain failed');
      expect(caught!.message).toContain('30 days');
      expect(caught!.message).toContain('You can return items within one month.');
    });

    it('error name is DeterministicAssertionError', () => {
      let caught: Error | undefined;
      try {
        deterministicExpect('foo').toContain('bar');
      } catch (e) {
        caught = e as Error;
      }
      expect(caught!.name).toBe('DeterministicAssertionError');
    });
  });
});
