import * as fs from 'fs/promises';
import * as path from 'path';
import { ImportFailure } from '../../../core/domain/model/ImportFailure';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';

const REPORT_PATH = path.resolve(process.cwd(), 'import-failures.txt');

export class FileImportFailureReporter implements ReportImportFailuresPort {
  async report(failures: ImportFailure[]): Promise<void> {
    if (failures.length === 0) {
      await fs.rm(REPORT_PATH, { force: true });
      return;
    }

    const timestamp = new Date().toISOString();
    const lines = [
      `Import failures — ${timestamp}`,
      `Total: ${failures.length}`,
      '',
      ...failures.map((f) => `Row ${f.rowIndex}: ${f.reason}`),
    ];

    await fs.writeFile(REPORT_PATH, lines.join('\n') + '\n', 'utf-8');
  }
}
