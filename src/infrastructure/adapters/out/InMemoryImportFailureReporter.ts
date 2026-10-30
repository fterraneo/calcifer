import { ImportFailure } from '../../../core/domain/model/ImportFailure';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';

export class InMemoryImportFailureReporter implements ReportImportFailuresPort {
  public reportedFailures: ImportFailure[] = [];

  async report(failures: ImportFailure[]): Promise<void> {
    this.reportedFailures.push(...failures);
  }

  async clear(): Promise<void> {
    this.reportedFailures = [];
  }
}
