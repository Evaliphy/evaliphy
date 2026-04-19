import { createLLMClient } from "@evaliphy/ai";
import { createHttpClient } from "@evaliphy/client";
import type { EvaliphyReporter } from '@evaliphy/core';
import { emitter, EvaliphyConfig, EvaluationFixtures, } from '@evaliphy/core';
import { ConsoleReporter, HtmlWriter, JsonAccumulator } from '@evaliphy/reporters';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFixtures(config: EvaliphyConfig): EvaluationFixtures {
    let httpClientInstance: any = null;
    let llmClientInstance: any = null;

  return {
      get httpClient() {
        if (!httpClientInstance) {
          httpClientInstance = createHttpClient({
            baseUrl: config.http?.baseUrl || 'http://localhost:3000',
            timeout: config.http?.timeout,
            retry: config.http?.retry,
            headers: config.http?.headers,
          });
        }
        return httpClientInstance;
      },
      get llmClient() {
        if (!llmClientInstance) {
          llmClientInstance = createLLMClient(config.llmAsJudgeConfig!);
        }
        return llmClientInstance;
      }
    };
}

export function registerReporters(reporters: EvaliphyReporter[]) {
    for (const reporter of reporters) {
        if (reporter.onRunStart) emitter.on('run:start', (p) => reporter.onRunStart!(p));
        if (reporter.onTestStart) emitter.on('test:start', (p) => reporter.onTestStart!(p));
        if (reporter.onTestPass) emitter.on('test:pass', (p) => reporter.onTestPass!(p));
        if (reporter.onTestFail) emitter.on('test:fail', (p) => reporter.onTestFail!(p));
        if (reporter.onTestRetry) emitter.on('test:retry', (p) => reporter.onTestRetry!(p));
        if (reporter.onRunEnd) emitter.on('run:end', (p) => reporter.onRunEnd!(p));
        if (reporter.onDiscoveryStart) emitter.on('discovery:start', (p) => reporter.onDiscoveryStart!(p));
        if (reporter.onDiscoveryFile) emitter.on('discovery:file', (p) => reporter.onDiscoveryFile!(p));
        if (reporter.onDiscoveryEnd) emitter.on('discovery:end', (p) => reporter.onDiscoveryEnd!(p));
    }
}

export function resolveReporters(fileConfig: EvaliphyConfig): EvaliphyReporter[] {
    const rawReporters = fileConfig.reporters || ['console'];
    const reportersConfig = Array.isArray(rawReporters)
        ? rawReporters
        : (rawReporters as string).split(',').map((r: string) => r.trim());
    const reporters: EvaliphyReporter[] = [];

    // Json reporter is always on
    const jsonAccumulator = new JsonAccumulator({
        onComplete: async (report) => {
            const baseDir = fileConfig.configFile ? path.dirname(fileConfig.configFile) : process.cwd();
            const reportDir = path.join(baseDir, 'report');
            await fs.mkdir(reportDir, { recursive: true });
            const reportPath = path.join(reportDir, `report-${report.meta.runId}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

            // Generate HTML report
            HtmlWriter.write(report, reportDir);
        }
    });
    // NOTE: do NOT call jsonAccumulator.attach() here. registerReporters() below
    // subscribes the same onRunStart/onTestPass/onTestFail/onRunEnd handlers via
    // the generic reporter wiring loop, so calling attach() would double-register
    // them and each test would be appended to the RunReportBuilder twice -- the
    // exact "same test appears twice in the HTML report" bug described in #34.
    reporters.push(jsonAccumulator);

    for (const reporter of reportersConfig) {
        if (typeof reporter === 'string') {
            if (reporter === 'console') {
                reporters.push(new ConsoleReporter({ verbose: (fileConfig as any).verbose }));
            }
        } else {
            reporters.push(reporter);
        }
    }
    return reporters;
}
