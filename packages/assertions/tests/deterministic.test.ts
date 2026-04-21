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

  describe('toNotContain', () => {
    it('passes when value does not contain expected', () => {
      const r = deterministicExpect('No refunds available.').toNotContain('refund window');
      expect(r.passed).toBe(true);
      expect(r.assertionName).toBe('toNotContain');
    });
    it('throws when value contains expected', () => {
      expect(() => deterministicExpect('30 day refund window.').toNotContain('refund window')).toThrow(DeterministicAssertionError);
    });
  });

  describe('toContainAll', () => {
    it('passes when all substrings present', () => {
      const r = deterministicExpect('Ships in 3-5 days. Free returns.').toContainAll(['3-5 days', 'Free returns']);
      expect(r.passed).toBe(true);
    });
    it('throws when any substring missing', () => {
      expect(() => deterministicExpect('Ships in 3-5 days.').toContainAll(['3-5 days', 'Free returns'])).toThrow(DeterministicAssertionError);
    });
  });

  describe('toContainAny', () => {
    it('passes when at least one substring present', () => {
      const r = deterministicExpect('Call us or email support.').toContainAny(['call', 'email', 'chat']);
      expect(r.passed).toBe(true);
    });
    it('throws when none present', () => {
      expect(() => deterministicExpect('Visit our FAQ.').toContainAny(['call', 'email', 'chat'])).toThrow(DeterministicAssertionError);
    });
  });

  describe('toMatchRegex', () => {
    it('passes when value matches pattern', () => {
      const r = deterministicExpect('Order #12345 confirmed.').toMatchRegex(/Order #\d+/);
      expect(r.passed).toBe(true);
      expect(r.assertionName).toBe('toMatchRegex');
    });
    it('throws when value does not match pattern', () => {
      expect(() => deterministicExpect('No order here.').toMatchRegex(/Order #\d+/)).toThrow(DeterministicAssertionError);
    });
  });

  describe('toHaveMinLength', () => {
    it('passes when length meets minimum', () => {
      const r = deterministicExpect('hello world').toHaveMinLength(5);
      expect(r.passed).toBe(true);
    });
    it('throws when length below minimum', () => {
      expect(() => deterministicExpect('hi').toHaveMinLength(10)).toThrow(DeterministicAssertionError);
    });
  });

  describe('toHaveMaxLength', () => {
    it('passes when length does not exceed maximum', () => {
      const r = deterministicExpect('short').toHaveMaxLength(100);
      expect(r.passed).toBe(true);
    });
    it('throws when length exceeds maximum', () => {
      expect(() => deterministicExpect('a very long string here').toHaveMaxLength(5)).toThrow(DeterministicAssertionError);
    });
  });

  describe('toHaveLengthBetween', () => {
    it('passes when length within range', () => {
      const r = deterministicExpect('hello').toHaveLengthBetween(3, 10);
      expect(r.passed).toBe(true);
      expect(r.assertionName).toBe('toHaveLengthBetween');
    });
    it('throws when length below min', () => {
      expect(() => deterministicExpect('hi').toHaveLengthBetween(5, 20)).toThrow(DeterministicAssertionError);
    });
    it('throws when length above max', () => {
      expect(() => deterministicExpect('way too long text here').toHaveLengthBetween(1, 5)).toThrow(DeterministicAssertionError);
    });
  });
});
