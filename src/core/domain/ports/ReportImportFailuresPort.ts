import { ImportFailure } from '../model/ImportFailure';

export interface ReportImportFailuresPort {
  report(failures: ImportFailure[]): Promise<void>;
  clear(): Promise<void>;
}
