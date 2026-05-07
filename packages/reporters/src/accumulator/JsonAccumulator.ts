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
    const result = payload.result as RunResult;
    if (result) {
      this.builder.append(result);
    }
  }

  onTestFail(payload: TestFailPayload): void {
    const result = payload.result as RunResult;
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
