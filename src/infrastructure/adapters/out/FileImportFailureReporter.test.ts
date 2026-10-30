import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { FileImportFailureReporter } from './FileImportFailureReporter';
import { ImportFailure } from '../../../core/domain/model/ImportFailure';

describe('FileImportFailureReporter', () => {
  let dir: string;
  let reportPath: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'calcifer-'));
    reportPath = path.join(dir, 'import-failures.txt');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('appends failures across successive reports', async () => {
    const reporter = new FileImportFailureReporter(reportPath);

    await reporter.report([new ImportFailure(3, 'missing date')]);
    await reporter.report([new ImportFailure(7, 'invalid amount value: x')]);

    const content = await fs.readFile(reportPath, 'utf-8');
    expect(content).toContain('Row 3: missing date');
    expect(content).toContain('Row 7: invalid amount value: x');
  });

  it('does not create the file when reporting an empty list', async () => {
    const reporter = new FileImportFailureReporter(reportPath);

    await reporter.report([]);

    await expect(fs.access(reportPath)).rejects.toThrow();
  });

  it('clear removes the report file', async () => {
    const reporter = new FileImportFailureReporter(reportPath);
    await reporter.report([new ImportFailure(1, 'boom')]);

    await reporter.clear();

    await expect(fs.access(reportPath)).rejects.toThrow();
  });
});
