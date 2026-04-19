import {
  DiscoveryEndPayload,
  DiscoveryFilePayload,
  DiscoveryStartPayload,
  EvaliphyError,
  EvaliphyReporter,
  RunEndPayload,
  RunStartPayload,
  TestFailPayload,
  TestPassPayload,
  TestRetryPayload,
  TestStartPayload
} from '@evaliphy/core';
import path from 'path';
import pc from 'picocolors';

export interface ConsoleReporterOptions {
  verbose?: boolean;
  showSlowAt?: number;
  compact?: boolean;
}

export class ConsoleReporter implements EvaliphyReporter {
  name = 'console-reporter';
  private options: Required<ConsoleReporterOptions>;
  private startTime: number = 0;
  private runTimestamp: string = '';
  private failures: TestFailPayload[] = [];
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private spinnerTimer: ReturnType<typeof setInterval> | null = null;
  private currentTestName = '';

  constructor(options: ConsoleReporterOptions = {}) {
    this.options = {
      verbose: options.verbose ?? false,
      showSlowAt: options.showSlowAt ?? 1000,
      compact: options.compact ?? false,
    };
  }

  private startSpinner(testName: string) {
    if (!process.stdout.isTTY) return;
    this.currentTestName = testName;
    this.spinnerIndex = 0;
    const render = () => {
      const frame = this.spinnerFrames[this.spinnerIndex++ % this.spinnerFrames.length];
      process.stdout.write(`\r  ${pc.cyan(frame)} ${pc.dim(testName.substring(0, 40).padEnd(40))}`);
    };
    render();
    this.spinnerTimer = setInterval(render, 80);
  }

  private stopSpinner() {
    if (this.spinnerTimer !== null) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = null;
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private getSeparator(): string {
    const width = Math.min(process.stdout.columns || 80, 80);
    return pc.dim('─'.repeat(width));
  }

  onRunStart(payload: RunStartPayload) {
    this.startTime = Date.now();
    this.runTimestamp = new Date().toISOString();
    this.failures = [];
    
    console.log(`\n ${pc.cyan(pc.bold('evaliphy'))} ${pc.dim('v1.0.0')}`);
    console.log(this.getSeparator());
    
    const details: [string, string][] = [
      ['Run ID', payload.runId],
      ['Model', payload.resolvedConfig.llmAsJudgeConfig?.model || 'default'],
      ['Timeout', payload.resolvedConfig.timeout ? `${payload.resolvedConfig.timeout}ms` : 'default'],
    ];

    details.forEach(([label, value]) => {
      console.log(` ${pc.dim(label.padEnd(10))} ${pc.white(value)}`);
    });
    console.log(this.getSeparator() + '\n');
  }

  onTestStart(payload: TestStartPayload) {
    this.startSpinner(payload.testName);
  }

  onTestPass(payload: TestPassPayload) {
    this.stopSpinner();
    if (process.stdout.isTTY) {
      process.stdout.write('\r');
    }
    const duration = this.formatDuration(payload.duration);
    const durationStr = payload.duration > this.options.showSlowAt ? pc.yellow(duration) : pc.dim(duration);
    console.log(`  ${pc.green('✓')} ${pc.white(payload.testName.padEnd(40))} ${durationStr.padStart(10)}`);
  }

  onTestFail(payload: TestFailPayload) {
    this.stopSpinner();
    this.failures.push(payload);
    if (process.stdout.isTTY) {
      process.stdout.write('\r');
    }
    const duration = this.formatDuration(payload.duration);
    console.log(`  ${pc.red('✗')} ${pc.red(payload.testName.padEnd(40))} ${pc.red(duration).padStart(10)}`);
  }

  onTestRetry(payload: TestRetryPayload) {
    this.stopSpinner();
    if (process.stdout.isTTY) {
      process.stdout.write('\r');
    }
    console.log(`  ${pc.yellow('↺')} ${pc.white(payload.testName.padEnd(40))} ${pc.dim(`(retry ${payload.attempt}/${payload.maxRetries})`).padStart(10)}`);
    this.startSpinner(payload.testName);
  }

  onRunEnd(payload: RunEndPayload) {
    if (this.failures.length > 0 && !this.options.compact) {
      console.log(`\n ${pc.bold(pc.red('Failures'))}`);
      
      this.failures.forEach((failure, index) => {
        console.log(`\n ${pc.red(`${index + 1}. ${failure.testName}`)}`);
        
        if (failure.error instanceof EvaliphyError) {
            console.log(`    ${pc.dim('Code:')}  ${pc.red(failure.error.code)}`);
            console.log(`    ${pc.dim('Error:')} ${pc.white(failure.error.message)}`);
            if (failure.error.hint) {
                console.log(`    ${pc.dim('Hint:')}  ${pc.yellow(failure.error.hint)}`);
            }
        } else {
            console.log(`    ${pc.dim('Error:')} ${pc.red(failure.error.message)}`);
            if (failure.error.stack && this.options.verbose) {
                console.log(`\n${pc.dim(failure.error.stack)}`);
            }
        }
      });
    }

    const total = payload.passed + payload.failed;
    const duration = this.formatDuration(payload.duration);

    console.log('\n' + this.getSeparator());
    
    const summary = [
      pc.bold('Tests:       ') + (payload.failed > 0 ? pc.red(`${payload.failed} failed`) + pc.dim(', ') : '') + pc.green(`${payload.passed} passed`) + pc.dim(`, ${total} total`),
      pc.bold('Time:        ') + pc.white(duration),
      pc.bold('Run ID:      ') + pc.dim(payload.runId),
      pc.bold('HTML Report: ') + pc.dim('reports/run-' + this.runTimestamp.replace(/[:.]/g, '-') + '/report.html')
    ];

    summary.forEach(line => console.log(` ${line}`));
    console.log(this.getSeparator() + '\n');

    if (payload.failed > 0) {
      console.log(`  ${pc.red(pc.bold('FAIL'))} ${pc.red('Run failed')}\n`);
    } else {
      console.log(`  ${pc.green(pc.bold('PASS'))} ${pc.green('Run passed')}\n`);
    }
  }

  onDiscoveryStart(payload: DiscoveryStartPayload) {
    console.log(`\n ${pc.dim('Discovering tests in')} ${pc.white(payload.dir)}...`);
  }

  onDiscoveryFile(payload: DiscoveryFilePayload) {
    console.log(`  ${pc.dim(path.relative(process.cwd(), payload.file))}`);
  }

  onDiscoveryEnd(payload: DiscoveryEndPayload) {
    console.log(`\n ${pc.dim('Found')} ${pc.white(payload.fileCount)} ${pc.dim('files,')} ${pc.white(payload.totalTests)} ${pc.dim('tests\n')}`);
  }
}
