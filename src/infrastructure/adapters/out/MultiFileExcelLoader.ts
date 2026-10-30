import { Transaction } from '../../../core/domain/model/Transaction';
import { DeduplicatedTransactions } from '../../../core/domain/model/DeduplicatedTransactions';
import { ImportFailure } from '../../../core/domain/model/ImportFailure';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';

// Summary entries are not row-level failures; rowIndex 0 marks them as run-level.
const SUMMARY_ROW = 0;

function keyOf(tx: Transaction): string {
  return JSON.stringify([
    tx.date.toISOString(),
    tx.description,
    tx.details,
    tx.amount,
    tx.category,
    tx.currency,
  ]);
}

function deduplicate(transactions: Transaction[]): DeduplicatedTransactions {
  const seen = new Map<string, Transaction>();
  for (const tx of transactions) {
    const key = keyOf(tx);
    if (!seen.has(key)) seen.set(key, tx);
  }
  return {
    unique: [...seen.values()],
    duplicateCount: transactions.length - seen.size,
  };
}

export class MultiFileExcelLoader implements LoadTransactionsPort {
  constructor(
    private readonly sources: LoadTransactionsPort[],
    private readonly failureReporter: ReportImportFailuresPort,
  ) {}

  async load(): Promise<Transaction[]> {
    const loaded: Transaction[] = [];
    for (const source of this.sources) {
      loaded.push(...(await source.load()));
    }

    const { unique, duplicateCount } = deduplicate(loaded);

    await this.failureReporter.report([
      new ImportFailure(SUMMARY_ROW, `files processed: ${this.sources.length}`),
      new ImportFailure(SUMMARY_ROW, `duplicates removed: ${duplicateCount}`),
    ]);

    return unique;
  }
}
