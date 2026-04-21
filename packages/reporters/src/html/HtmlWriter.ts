import fs from 'node:fs';
import path from 'node:path';
import type { RunReport } from '../accumulator/RunReportBuilder.js';
import { PageRenderer } from './renderer/PageRenderer.js';

export class HtmlWriter {
  static write(report: RunReport, outputDir: string): string {
    const html = PageRenderer.render(report);
    const fileName = 'report.html';
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html, 'utf-8');
    return outputPath;
  }
}
