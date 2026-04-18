import type { RunResult } from '../../accumulator/RunReportBuilder.js';
import { getScoreColor } from '../helpers/colorScale.js';
import { formatScore } from '../helpers/formatters.js';

export class FailureDetail {
  static render(result: RunResult): string {
    const assertions = Object.entries(result.assertions || {});
    
    return `
      <div class="detail-content">
        <div class="detail-grid">
          <div>
            <div class="detail-section-title">Query</div>
            <div class="detail-box">${this.escapeHtml(result.inputs.query || '')}</div>

            <div class="detail-section-title" style="margin-top: 1rem;">Context</div>
            <div class="detail-box">${this.escapeHtml(result.inputs.context || '')}</div>
          </div>
          <div>
            <div class="detail-section-title">Response</div>
            <div class="detail-box">${this.escapeHtml(result.inputs.response || '')}</div>
          </div>
        </div>
        ${assertions.length > 0 ? `
          <div class="assertions-section">
            <div class="detail-section-title">Assertions (${assertions.length})</div>
            <div class="assertion-list">
              ${assertions.map(([name, data]) => `
                <div class="assertion-card ${data.passed ? 'passed' : 'failed'}">
                  <div class="assertion-card-header">
                    <div class="assertion-card-name">
                      <span class="assertion-name">${name}</span>
                      <span class="status-badge status-${data.passed ? 'passed' : 'failed'}">
                        ${data.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div class="assertion-score">
                      <div class="assertion-score-label">Score</div>
                      <div class="assertion-score-value" style="color: ${getScoreColor(data.score)};">${formatScore(data.score)}</div>
                    </div>
                  </div>

                  <div class="assertion-threshold-row">
                    <div class="assertion-threshold-cell">
                      <div class="assertion-meta-label">Expected</div>
                      <div class="assertion-meta-value">Score &ge; ${data.threshold ?? '0.7'}</div>
                    </div>
                    <div class="assertion-threshold-cell">
                      <div class="assertion-meta-label">Actual</div>
                      <div class="assertion-meta-value" style="color: ${getScoreColor(data.score)}; font-weight: 600;">${formatScore(data.score)}</div>
                    </div>
                  </div>

                  <div class="assertion-reasoning">
                    <div class="assertion-meta-label">Judge Reasoning</div>
                    <div class="assertion-reason">${this.escapeHtml(data.reason || 'No reasoning provided.')}</div>
                  </div>

                  <div class="assertion-card-footer">
                    <span>Model: <code>${data.model || 'unknown'}</code></span>
                    ${data.durationMs ? `<span>Duration: ${data.durationMs}ms</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${result.error ? `
          <div style="margin-top: 1rem;">
            <div class="detail-section-title">Error Stack</div>
            <div class="detail-box" style="color: var(--failure-color);">${this.escapeHtml(result.error.stack || result.error.message)}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
}
