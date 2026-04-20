import {
  DiscoveryEndPayload,
  DiscoveryFilePayload,
  DiscoveryStartPayload,
  EvaliphyReporter,
  RunEndPayload,
  RunStartPayload,
  TestFailPayload,
  TestPassPayload,
  TestRetryPayload,
  TestStartPayload,
} from '@evaliphy/core';
import { RunReport, RunReportBuilder, RunResult } from './RunReportBuilder.js';

export type OnCompleteCallback = (report: RunReport) => Promise<void>;

export interface JsonAccumulatorOptions {
  onComplete: OnCompleteCallback;
}

export class JsonAccumulator implements EvaliphyReporter {
  name = 'json-accumulator';
  private builder: RunReportBuilder;
  private onComplete: OnCompleteCallback;

  constructor(options: JsonAccumulatorOptions) {
    this.builder = new RunReportBuilder();
    this.onComplete = options.onComplete;
  }
    onTestStart?: ((payload: TestStartPayload) => void | Promise<void>) | undefined;
    onTestRetry?: ((payload: TestRetryPayload) => void | Promise<void>) | undefined;
    onDiscoveryStart?: ((payload: DiscoveryStartPayload) => void | Promise<void>) | undefined;
    onDiscoveryFile?: ((payload: DiscoveryFilePayload) => void | Promise<void>) | undefined;
    onDiscoveryEnd?: ((payload: DiscoveryEndPayload) => void | Promise<void>) | undefined;

  onRunStart(payload: RunStartPayload): void {
    this.builder.init({
      runId: payload.runId,
      resolvedConfig: payload.resolvedConfig
    });
  }

  onTestPass(payload: TestPassPayload): void {
    // Note: TestPassPayload currently doesn't have the full RunResult.
    // In a real scenario, we'd need to capture the result from the execution context
    // or have it passed in the payload. For now, we'll map what we have.
    // This might need adjustment once we have a way to get the full result.
    
    // If the payload had a 'result' property, we'd use it.
    const result = (payload as any).result as RunResult;
    if (result) {
      this.builder.append(result);
    }
  }

  onTestFail(payload: TestFailPayload): void {
    const result = (payload as any).result as RunResult;
    this.builder.appendError({
      testName: payload.testName,
      error: payload.error,
      duration: payload.duration,
      result
    });
  }

  async onRunEnd(payload: RunEndPayload): Promise<void> {
    const report = this.builder.finalise({
      passed: payload.passed,
      failed: payload.failed,
      duration: payload.duration
    });
    await this.onComplete(report);
  }
}
