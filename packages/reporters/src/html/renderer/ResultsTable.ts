import type { RunResult } from '../../accumulator/RunReportBuilder.js';
import { FailureDetail } from './FailureDetail.js';

export class ResultsTable {
  static render(results: RunResult[]): string {
    return `
      <div class="filters">
        <button class="filter-btn active" data-status="all">All (${results.length})</button>
        <button class="filter-btn" data-status="passed">Passed (${results.filter(r => r.status === 'passed').length})</button>
        <button class="filter-btn" data-status="failed">Failed (${results.filter(r => r.status === 'failed').length})</button>
        <button class="filter-btn" data-status="error">Error (${results.filter(r => r.status === 'error').length})</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Sample ID</th>
            <th>Eval File</th>
            <th>TTFB</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(result => this.renderRow(result)).join('')}
        </tbody>
      </table>
    `;
  }

  private static renderRow(result: RunResult): string {
    const statusClass = result.status;
    const assertionsArray = this.getAssertionsArray(result);
    const isExpandable = result.status !== 'passed' || assertionsArray.length > 0;
    
    return `
      <tr class="main-row ${statusClass} ${isExpandable ? 'expandable' : ''}" data-status="${result.status}">
        <td>
          <span class="status-badge status-${result.status}">${result.status}</span>
          ${this.renderAssertionBadges(result)}
        </td>
        <td style="font-weight: 500;">${result.sampleId}</td>
        <td style="color: var(--gray-color); font-size: 0.75rem;">${result.evalFile}</td>
        <td>${result.timings.ttfb}ms</td>
        <td>${result.timings.total}ms</td>
      </tr>
      ${isExpandable ? `
        <tr class="detail-row">
          <td colspan="5">
            ${FailureDetail.render(result)}
          </td>
        </tr>
      ` : ''}
    `;
  }

  private static renderAssertionBadges(result: RunResult): string {
    const assertions = result.assertions;
    if (!assertions) return '';

    let passed = 0;
    let failed = 0;

    if (Array.isArray(assertions)) {
      for (const a of assertions) {
        if (a.passed) passed++;
        else failed++;
      }
    } else {
      // Handle grouped object { name: Array }
      for (const name in assertions) {
        const list = assertions[name];
        if (Array.isArray(list)) {
          for (const a of list) {
            if (a.passed) passed++;
            else failed++;
          }
        }
      }
    }

    if (passed === 0 && failed === 0) return '';

    return `
      <div style="display: flex; gap: 4px; margin-top: 4px;">
        ${passed > 0 ? `<span class="status-badge status-passed" style="font-size: 0.65rem; padding: 1px 4px;">${passed} ✓</span>` : ''}
        ${failed > 0 ? `<span class="status-badge status-failed" style="font-size: 0.65rem; padding: 1px 4px;">${failed} ✗</span>` : ''}
      </div>
    `;
  }

  private static getAssertionsArray(result: any): any[] {
    const assertions = result.assertions;
    if (!assertions) return [];
    if (Array.isArray(assertions)) return assertions;
    
    const flat: any[] = [];
    for (const name in assertions) {
      const list = assertions[name];
      if (Array.isArray(list)) {
        for (const a of list) {
          flat.push({ ...a, name });
        }
      }
    }
    return flat;
  }
}
