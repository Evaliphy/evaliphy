import {
    DiscoveryEndPayload,
    DiscoveryFilePayload,
    DiscoveryStartPayload,
    EvaliphyReporter,
    logger,
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
      logger.debug({ 
        sampleId: result.sampleId, 
        assertionCount: result.assertions?.length,
        assertions: result.assertions?.map(a => a.name)
      }, 'JsonAccumulator: onTestPass');
      this.builder.append(this.transformResult(result));
    }
  }

  onTestFail(payload: TestFailPayload): void {
    const result = payload.result as RunResult;
    logger.debug({ 
      sampleId: payload.testName, 
      hasResult: !!result,
      assertionCount: result?.assertions?.length 
    }, 'JsonAccumulator: onTestFail');
    this.builder.appendError({
      testName: payload.testName,
      error: payload.error,
      duration: payload.duration,
      result: result ? this.transformResult(result) : undefined
    });
  }

  private transformResult(result: RunResult): any {
    const assertions: Record<string, any[]> = {};
    for (const assertion of result.assertions) {
      if (!assertions[assertion.name]) {
        assertions[assertion.name] = [];
      }
      assertions[assertion.name].push({
        score: assertion.score,
        passed: assertion.passed,
        reason: assertion.reason,
        threshold: assertion.threshold,
        durationMs: assertion.durationMs,
        llmTokens: assertion.llmTokens,
        model: assertion.model
      });
    }

    logger.debug({ 
      sampleId: result.sampleId, 
      groupedAssertions: Object.keys(assertions).map(k => `${k}: ${assertions[k].length}`)
    }, 'JsonAccumulator: transformResult complete');

    return {
      ...result,
      _originalAssertions: result.assertions,
      assertions
    };
  }

  async onRunEnd(payload: RunEndPayload): Promise<void> {
    const finalReport = this.builder.finalise({
      passed: payload.passed,
      failed: payload.failed,
      duration: payload.duration
    });

    // Strip internal _originalAssertions before sending report
    if (finalReport.results) {
      for (const res of finalReport.results) {
        delete (res as any)._originalAssertions;
      }
    }

    await this.onComplete(finalReport);
  }
}
