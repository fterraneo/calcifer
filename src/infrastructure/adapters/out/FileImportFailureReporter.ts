import * as fs from 'fs/promises';
import * as path from 'path';
import { ImportFailure } from '../../../core/domain/model/ImportFailure';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';

const DEFAULT_REPORT_PATH = path.resolve(process.cwd(), 'import-failures.txt');

export class FileImportFailureReporter implements ReportImportFailuresPort {
  constructor(private readonly reportPath: string = DEFAULT_REPORT_PATH) {}

  async clear(): Promise<void> {
    await fs.rm(this.reportPath, { force: true });
  }

  async report(failures: ImportFailure[]): Promise<void> {
    if (failures.length === 0) return;

    const timestamp = new Date().toISOString();
    const lines = [
      `Import failures — ${timestamp}`,
      `Total in batch: ${failures.length}`,
      '',
      ...failures.map((f) => `Row ${f.rowIndex}: ${f.reason}`),
      '',
    ];

    await fs.appendFile(this.reportPath, lines.join('\n'), 'utf-8');
  }
}
