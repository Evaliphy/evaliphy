import { EvaliphyConfig, getResult } from '@evaliphy/core';

export interface RunReport {
  meta: {
    runId: string;
    timestamp: string;
    duration: number;
    evalFiles: string[];
    config: {
      runner?: {
        timeout?: number;
      };
      http?: {
        baseUrl?: string;
        timeout?: number;
      };
      judge?: {
        model?: string;
        provider?: string;
        timeout?: number;
        promptsDir?: string;
      };
    };
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byAssertion: Record<string, {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
      avgScore: number;
    }>;
  };
  results: RunResult[];
}

export interface RunResult {
  sampleId: string;
  evalFile: string;
  status: 'passed' | 'failed' | 'error';
  inputs: {
    query: string;
    context: string;
    response: string;
    expected?: string;
  };
  assertions: Array<{
    name: string;
    score: number;
    passed: boolean;
    reason: string;
    threshold?: number;
    durationMs: number;
    llmTokens: number;
    model?: string;
  }>;
  http: {
    status: number;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  };
  timings: {
    ttfb: number;
    total: number;
    streamEnd?: number;
    judgeMs?: number;
  };
  error?: {
    message: string;
    type: string;
    stack?: string;
  };
}

export class RunReportBuilder {
  private report: Partial<RunReport> = {
    results: []
  };
  private assertionStats: Record<string, { total: number; passed: number; scores: number[] }> = {};

  init(payload: { runId: string; resolvedConfig: EvaliphyConfig }) {
    this.report.meta = {
      runId: payload.runId,
      timestamp: new Date().toISOString(),
      duration: 0,
      evalFiles: [], // Will be populated if we have that info, or we can extract from results
      config: {
        runner: {
          timeout: payload.resolvedConfig.timeout
        },
        http: {
          baseUrl: payload.resolvedConfig.http?.baseUrl,
          timeout: payload.resolvedConfig.http?.timeout
        },
        judge: {
          model: payload.resolvedConfig.llmAsJudgeConfig?.model,
          provider: payload.resolvedConfig.llmAsJudgeConfig?.provider?.type,
          // timeout: payload.resolvedConfig.llmAsJudgeConfig?.timeout, // Not in EvaliphyConfig yet?
          promptsDir: payload.resolvedConfig.llmAsJudgeConfig?.promptsDir
        }
      }
    };
  }

  append(result: RunResult) {
    this.report.results?.push(result);
    
    // Update assertion stats
    for (const data of result.assertions) {
      const assertionName = data.name.replace(/\(\)$/, '');
      if (!this.assertionStats[assertionName]) {
        this.assertionStats[assertionName] = { total: 0, passed: 0, scores: [] };
      }
      this.assertionStats[assertionName].total++;
      if (data.passed) this.assertionStats[assertionName].passed++;
      this.assertionStats[assertionName].scores.push(data.score);
    }
  }

  appendError(payload: { testName: string; error: Error; duration: number; result?: RunResult }) {
    const error = payload.error;
    
    // Try to get the result from payload or context
    let result = payload.result || getResult();

    if (result) {
      // If we have a result object, ensure it has the error details
      if (!result.error && !error.message.includes('failed:')) {
        result.error = {
          message: error.message,
          type: error.name,
          stack: error.stack
        };
      }
      
      // If it's a DeterministicAssertionError, ensure the failing assertion is recorded
      if (error.name === 'DeterministicAssertionError') {
        const detResult = (error as any).result;
        if (detResult && detResult.assertionName) {
            result.assertions.push({
                name: detResult.assertionName,
                score: detResult.score,
                passed: detResult.passed,
                reason: detResult.reason,
                durationMs: detResult.durationMs,
                llmTokens: 0,
                model: 'deterministic'
            });
        }
      }

      this.append(result);
      return;
    }

    if (error.name === 'DeterministicAssertionError') {
      const detResult = (error as any).result;
      const newResult: RunResult = {
        sampleId: payload.testName,
        evalFile: 'unknown',
        status: 'failed',
        inputs: {
          query: '',
          context: '',
          response: ''
        },
        assertions: [
          {
            name: detResult.assertionName,
            score: detResult.score,
            passed: detResult.passed,
            reason: detResult.reason,
            durationMs: detResult.durationMs,
            llmTokens: 0,
            model: 'deterministic'
          }
        ],
        http: {
          status: 0,
          url: '',
          method: 'POST'
        },
        timings: {
          ttfb: 0,
          total: payload.duration
        },
        error: {
          message: error.message,
          type: error.name,
          stack: error.stack
        }
      };
      this.append(newResult);
      return;
    }

    this.report.results?.push({
      sampleId: payload.testName,
      evalFile: 'unknown',
      status: 'error',
      inputs: {
        query: '',
        context: '',
        response: ''
      },
      assertions: [],
      http: {
        status: 0,
        url: '',
        method: 'POST'
      },
      timings: {
        ttfb: 0,
        total: payload.duration
      },
      error: {
        message: payload.error.message,
        type: payload.error.name,
        stack: payload.error.stack
      }
    });
  }

  finalise(summary: { passed: number; failed: number; duration: number }): RunReport {
    const total = summary.passed + summary.failed;
    
    const byAssertion: RunReport['summary']['byAssertion'] = {};
    for (const [name, stats] of Object.entries(this.assertionStats)) {
      byAssertion[name] = {
        total: stats.total,
        passed: stats.passed,
        failed: stats.total - stats.passed,
        passRate: stats.total > 0 ? stats.passed / stats.total : 0,
        avgScore: stats.scores.length > 0 ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : 0
      };
    }

    this.report.meta!.duration = summary.duration;
    // Extract unique eval files from results
    this.report.meta!.evalFiles = [...new Set(this.report.results?.map(r => r.evalFile).filter(f => f !== 'unknown'))];

    this.report.summary = {
      total,
      passed: summary.passed,
      failed: summary.failed,
      passRate: total > 0 ? summary.passed / total : 0,
      byAssertion
    };

    return this.report as RunReport;
  }
}
