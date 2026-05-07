import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonAccumulator } from '../src/accumulator/JsonAccumulator.js';

describe('JsonAccumulator', () => {
  let onComplete: any;
  let accumulator: JsonAccumulator;

  beforeEach(() => {
    onComplete = vi.fn().mockResolvedValue(undefined);
    accumulator = new JsonAccumulator({ onComplete });
  });

  it('finalises a run after handling run:start and run:end', async () => {
    accumulator.onRunStart({
      runId: 'test-run',
      totalTests: 1,
      resolvedConfig: { model: 'gpt-4' } as any
    } as any);

    await accumulator.onRunEnd({
      runId: 'test-run',
      passed: 1,
      failed: 0,
      duration: 100
    } as any);

    expect(onComplete).toHaveBeenCalled();
    const report = onComplete.mock.calls[0][0];
    expect(report.meta.runId).toBe('test-run');
  });

  it('accumulates test:pass and test:fail into the report', async () => {
    accumulator.onRunStart({
      runId: 'test-run',
      totalTests: 2,
      resolvedConfig: {} as any
    } as any);

    const result = {
      sampleId: 'test-1',
      evalFile: 'file1.eval.ts',
      status: 'passed',
      assertions: [{ name: 'a', score: 1, passed: true, durationMs: 1, llmTokens: 1 },
        { name: 'b', score: 1, passed: true, durationMs: 1, llmTokens: 1 }
      ],
      inputs: { query: 'q', context: 'c', response: 'r' },
      http: { status: 200, url: 'u', method: 'POST' },
      timings: { ttfb: 1, total: 1 }
    };

    accumulator.onTestPass({
      runId: 'test-run',
      testName: 'test-1',
      duration: 10,
      result
    } as any);

    accumulator.onTestFail({
      runId: 'test-run',
      testName: 'test-2',
      duration: 10,
      error: new Error('fail')
    } as any);

    await accumulator.onRunEnd({
      runId: 'test-run',
      passed: 1,
      failed: 1,
      duration: 100
    } as any);

    expect(onComplete).toHaveBeenCalled();
    const report = onComplete.mock.calls[0][0];
    
    expect(report.results).toHaveLength(2);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(1);
  });

  it('correctly groups multiple assertions of the same name into an array', async () => {
    accumulator.onRunStart({
      runId: 'multi-assertion-run',
      totalTests: 1,
      resolvedConfig: {} as any
    } as any);

    const result = {
      sampleId: 'test-multi',
      evalFile: 'file.eval.ts',
      status: 'passed',
      assertions: [
        { name: 'toContain', score: 1, passed: true, reason: 'Found "a"', durationMs: 1, llmTokens: 0 },
        { name: 'toContain', score: 1, passed: true, reason: 'Found "b"', durationMs: 1, llmTokens: 0 },
        { name: 'toBeCoherent', score: 1, passed: true, reason: 'Is coherent', durationMs: 10, llmTokens: 50, model: 'gpt-4' }
      ],
      inputs: { query: 'q', context: 'c', response: 'a b' },
      http: { status: 200, url: 'u', method: 'POST' },
      timings: { ttfb: 1, total: 1 }
    };

    accumulator.onTestPass({
      runId: 'multi-assertion-run',
      testName: 'test-multi',
      duration: 20,
      result
    } as any);

    await accumulator.onRunEnd({
      runId: 'multi-assertion-run',
      passed: 1,
      failed: 0,
      duration: 100
    } as any);

    const report = onComplete.mock.calls[0][0];
    const testResult = report.results[0];

    // Verify assertions is now an object with arrays
    expect(testResult.assertions).toBeTypeOf('object');
    expect(testResult.assertions.toContain).toBeInstanceOf(Array);
    expect(testResult.assertions.toContain).toHaveLength(2);
    expect(testResult.assertions.toBeCoherent).toBeInstanceOf(Array);
    expect(testResult.assertions.toBeCoherent).toHaveLength(1);

    // Verify content of first toContain
    expect(testResult.assertions.toContain[0]).toMatchObject({
      passed: true,
      reason: 'Found "a"'
    });

    // Verify content of second toContain
    expect(testResult.assertions.toContain[1]).toMatchObject({
      passed: true,
      reason: 'Found "b"'
    });

    // Verify toBeCoherent
    expect(testResult.assertions.toBeCoherent[0]).toMatchObject({
      model: 'gpt-4',
      llmTokens: 50
    });
  });
});
