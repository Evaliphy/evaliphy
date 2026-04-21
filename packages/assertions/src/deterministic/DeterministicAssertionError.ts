import type { DeterministicAssertionResult } from './types.js';

/**
 * Thrown by a deterministic assertion when the value fails the check.
 *
 * @example
 * // Thrown internally — not thrown directly by callers.
 * expect("You can return items within one month.").toContain("30 days");
 * // DeterministicAssertionError:
 * //   Response should mention return window
 * //
 * //   toContain failed
 * //
 * //   Expected to contain:
 * //     "30 days"
 * //
 * //   Received:
 * //     "You can return items within one month."
 */
export class DeterministicAssertionError extends Error {
  readonly result: DeterministicAssertionResult;

  constructor(result: DeterministicAssertionResult, received: string) {
    const lines: string[] = [];

    if (result.message) {
      lines.push(result.message);
      lines.push('');
    }

    lines.push(`  ${result.assertionName} failed`);
    lines.push('');
    lines.push(`  Expected to ${describeAssertion(result.assertionName)}:`);
    lines.push(`    "${expectedFromReason(result.reason)}"`);
    lines.push('');
    lines.push('  Received:');
    lines.push(`    "${received}"`);

    super(lines.join('\n'));
    this.name = 'DeterministicAssertionError';
    this.result = result;
  }
}

function describeAssertion(name: string): string {
  switch (name) {
    case 'toContain': return 'contain';
    default: return `satisfy ${name}`;
  }
}

function expectedFromReason(reason: string): string {
  // reason format: 'Value does not contain "foo"' — extract the quoted part
  const match = reason.match(/"([^"]+)"/);
  return match ? match[1] : reason;
}
