import { describe, expect, it } from 'vitest';
import { RunReportBuilder, RunResult } from '../src/accumulator/RunReportBuilder.js';

describe('RunReportBuilder', () => {
  it('should initialize with runId and config', () => {
    const builder = new RunReportBuilder();
    builder.init({
      runId: 'test-run',
      resolvedConfig: {
        model: 'gpt-4',
        timeout: 30000,
        http: { baseUrl: 'http://api.test' },
        llmAsJudgeConfig: { model: 'gpt-4o', promptsDir: 'prompts' }
      } as any
    });

    const report = builder.finalise({ passed: 0, failed: 0, duration: 100 });
    expect(report.meta.runId).toBe('test-run');
    expect(report.meta.config.runner?.timeout).toBe(30000);
    expect(report.meta.config.http?.baseUrl).toBe('http://api.test');
    expect(report.meta.config.judge?.model).toBe('gpt-4o');
  });

  it('should append results and calculate summary', () => {
    const builder = new RunReportBuilder();
    builder.init({ runId: 'test-run', resolvedConfig: {} as any });

    const result1: RunResult = {
      sampleId: 'test-1',
      evalFile: 'file1.eval.ts',
      status: 'passed',
      inputs: { query: 'q1', context: 'c1', response: 'r1' },
      assertions: [
        { name: 'toBeFaithful()', score: 0.9, passed: true, reason: 'good', durationMs: 100, llmTokens: 50 }
      ],
      http: { status: 200, url: 'url1', method: 'POST' },
      timings: { ttfb: 10, total: 50 }
    };

    const result2: RunResult = {
      sampleId: 'test-2',
      evalFile: 'file1.eval.ts',
      status: 'failed',
      inputs: { query: 'q2', context: 'c2', response: 'r2' },
      assertions: [
        { name: 'toBeFaithful()', score: 0.4, passed: false, reason: 'bad', durationMs: 120, llmTokens: 60 }
      ],
      http: { status: 200, url: 'url2', method: 'POST' },
      timings: { ttfb: 15, total: 60 }
    };

    builder.append(result1);
    builder.append(result2);

    const report = builder.finalise({ passed: 1, failed: 1, duration: 500 });

    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(1);
    expect(report.summary.passRate).toBe(0.5);
    expect(report.results).toHaveLength(2);
    expect(report.meta.evalFiles).toContain('file1.eval.ts');

    const assertionStats = report.summary.byAssertion['toBeFaithful'];
    expect(assertionStats.total).toBe(2);
    expect(assertionStats.passed).toBe(1);
    expect(assertionStats.avgScore).toBeCloseTo(0.65);
  });

  it('should handle errors via appendError', () => {
    const builder = new RunReportBuilder();
    builder.init({ runId: 'test-run', resolvedConfig: {} as any });

    builder.appendError({
      testName: 'failed-test',
      error: new Error('something went wrong'),
      duration: 150
    });

    const report = builder.finalise({ passed: 0, failed: 1, duration: 200 });
    expect(report.results[0].status).toBe('error');
    expect(report.results[0].error?.message).toBe('something went wrong');
    expect(report.results[0].timings.total).toBe(150);
  });
});
