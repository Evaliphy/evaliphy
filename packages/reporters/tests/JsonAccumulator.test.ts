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
      assertions: { a: { score: 1, passed: true, durationMs: 1, llmTokens: 1 } },
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
});
