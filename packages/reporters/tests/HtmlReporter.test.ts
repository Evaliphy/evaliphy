import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { getScoreColor, getStatusColor } from '../src/html/helpers/colorScale.js';
import { formatDuration, formatPercent, formatScore } from '../src/html/helpers/formatters.js';
import { HtmlWriter } from '../src/html/HtmlWriter.js';
import { FailureDetail } from '../src/html/renderer/FailureDetail.js';
import { PageRenderer } from '../src/html/renderer/PageRenderer.js';
import { ResultsTable } from '../src/html/renderer/ResultsTable.js';
import { SummarySection } from '../src/html/renderer/SummarySection.js';
import reportFixture from './fixture/report.json';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs') as any;
  return {
    ...actual,
    default: {
      ...actual.default,
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      existsSync: vi.fn(() => true),
    },
  };
});

describe('HtmlWriter', () => {
  it('should generate an HTML report string', () => {
    const html = PageRenderer.render(reportFixture as any);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Evaliphy Test Report');
    expect(html).toContain(reportFixture.meta.runId);
  });

  it('should write the report to disk', () => {
    const outputDir = './test-reports';
    const outputPath = HtmlWriter.write(reportFixture as any, outputDir);

    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(outputPath).toContain('report.html');
  });
});

describe('PageRenderer', () => {
  it('should include styles and scripts', () => {
    const html = PageRenderer.render(reportFixture as any);
    expect(html).toContain('<style>');
    expect(html).toContain('<script>');
    expect(html).toContain('window.__REPORT__ =');
  });

  it('should render provider information if available', () => {
    const reportWithProvider = {
      ...reportFixture,
      meta: {
        ...reportFixture.meta,
        config: {
          ...reportFixture.meta.config,
          judge: {
            ...reportFixture.meta.config.judge,
            provider: 'openai'
          }
        }
      }
    };
    const html = PageRenderer.render(reportWithProvider as any);
    expect(html).toContain('Provider: <strong>openai</strong>');
  });
});

describe('SummarySection', () => {
  it('should render pass rate cards', () => {
    const html = SummarySection.render(reportFixture as any);
    expect(html).toContain('Overall Pass Rate');
    expect(html).toContain(formatPercent(reportFixture.summary.passRate));
  });

  it('should render assertion breakdown cards', () => {
    const html = SummarySection.render(reportFixture as any);
    for (const name of Object.keys(reportFixture.summary.byAssertion)) {
      expect(html).toContain(name);
    }
  });
});

describe('ResultsTable', () => {
  it('should render table headers', () => {
    const html = ResultsTable.render(reportFixture.results as any);
    expect(html).toContain('Sample ID');
    expect(html).toContain('Eval File');
    expect(html).toContain('Status');
  });

  it('should render all result rows', () => {
    const html = ResultsTable.render(reportFixture.results as any);
    for (const result of reportFixture.results) {
      expect(html).toContain(result.sampleId);
    }
  });
});

describe('FailureDetail', () => {
  it('should render query, context, and response', () => {
    const result = reportFixture.results[0];
    const html = FailureDetail.render(result as any);
    expect(html).toContain('Query');
    expect(html).toContain('Context');
    expect(html).toContain('Response');
  });

  it('should render assertion reasons and scores', () => {
    const result = reportFixture.results[0];
    const html = FailureDetail.render(result as any);
    for (const [name, data] of Object.entries(result.assertions)) {
      expect(html).toContain(name);
      expect(html).toContain(data.reason);
    }
  });

  it('should render model name if available', () => {
    const resultWithModel = {
      ...reportFixture.results[0],
      assertions: {
        toBeFaithful: {
          ...reportFixture.results[0].assertions.toBeFaithful,
          model: 'gpt-4o'
        }
      }
    };
    const html = FailureDetail.render(resultWithModel as any);
    expect(html).toContain('gpt-4o');
  });
});

describe('Helpers', () => {
  it('formatDuration should format correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1500)).toBe('1.50s');
  });

  it('formatPercent should format correctly', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });

  it('formatScore should format correctly', () => {
    expect(formatScore(0.856)).toBe('0.86');
  });

  it('getScoreColor should return correct colors', () => {
    expect(getScoreColor(0.4)).toBe('#ef4444');
    expect(getScoreColor(0.6)).toBe('#f59e0b');
    expect(getScoreColor(0.9)).toBe('#10b981');
  });

  it('getStatusColor should return correct colors', () => {
    expect(getStatusColor('passed')).toBe('#10b981');
    expect(getStatusColor('failed')).toBe('#ef4444');
    expect(getStatusColor('error')).toBe('#6b7280');
  });
});
