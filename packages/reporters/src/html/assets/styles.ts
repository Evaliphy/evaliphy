export const styles = `
:root {
  --bg-color: #f9fafb;
  --text-color: #111827;
  --border-color: #e5e7eb;
  --card-bg: #ffffff;
  --primary-color: #2563eb;
  --success-color: #10b981;
  --failure-color: #ef4444;
  --warning-color: #f59e0b;
  --gray-color: #6b7280;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 2rem;
  line-height: 1.5;
}

header {
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
}

.meta-bar {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-color);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-color);
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.progress-bar-container {
  height: 0.5rem;
  background-color: var(--border-color);
  border-radius: 9999px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  font-size: 0.875rem;
  cursor: pointer;
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
  vertical-align: top;
}

tr.failed {
  background-color: #fef2f2;
}

tr.expandable {
  cursor: pointer;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-passed { background: #d1fae5; color: #065f46; }
.status-failed { background: #fee2e2; color: #991b1b; }
.status-error { background: #f3f4f6; color: #374151; }

.detail-row {
  display: none;
  background: #f9fafb;
}

.detail-row.open {
  display: table-row;
}

.detail-content {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.detail-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--gray-color);
  margin-bottom: 0.5rem;
}

.detail-box {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.assertions-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.assertion-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
  margin-top: 0.75rem;
}

.assertion-card {
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.assertion-card.passed {
  border-left: 4px solid var(--success-color);
}

.assertion-card.failed {
  border-left: 4px solid var(--failure-color);
}

.assertion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--border-color);
}

.assertion-card-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.assertion-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-color);
}

.assertion-score {
  text-align: right;
  flex-shrink: 0;
}

.assertion-score-label {
  font-size: 0.7rem;
  color: var(--gray-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.assertion-score-value {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.1;
}

.assertion-threshold-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0.625rem 1rem;
  background: rgba(0, 0, 0, 0.015);
}

.assertion-threshold-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assertion-meta-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-color);
  font-weight: 600;
}

.assertion-meta-value {
  font-size: 0.875rem;
  color: var(--text-color);
}

.assertion-reasoning {
  padding: 0.75rem 1rem;
}

.assertion-reason {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-color);
  margin-top: 0.25rem;
}

.assertion-card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-color);
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--border-color);
}

.assertion-card-footer code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--text-color);
}
`;
