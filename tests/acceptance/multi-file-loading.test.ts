import { Transaction } from '../../src/core/domain/model/Transaction';
import { InMemoryTransactionLoader } from '../../src/infrastructure/adapters/out/InMemoryTransactionLoader';
import { InMemoryImportFailureReporter } from '../../src/infrastructure/adapters/out/InMemoryImportFailureReporter';
import { MultiFileExcelLoader } from '../../src/infrastructure/adapters/out/MultiFileExcelLoader';

const tx = (day: string, description: string, amount: number) =>
  new Transaction(new Date(`2026-06-${day}`), description, '', amount, 'Others', 'EUR');

describe('Multi-file loading — Acceptance', () => {
  it('loads all files, removes duplicates across and within files, and preserves order', async () => {
    const file1 = [
      tx('01', 'Coffee', -1.5),
      tx('02', 'Bread', -2),
      tx('02', 'Bread', -2), // duplicate within the same file
    ];
    const file2 = [
      tx('02', 'Bread', -2), // duplicate across files
      tx('03', 'Taxi', -12),
    ];
    const file3 = [
      tx('03', 'Taxi', -12), // duplicate across files
      tx('04', 'Rent', -500),
    ];
    const reporter = new InMemoryImportFailureReporter();
    const loader = new MultiFileExcelLoader(
      [
        new InMemoryTransactionLoader(file1),
        new InMemoryTransactionLoader(file2),
        new InMemoryTransactionLoader(file3),
      ],
      reporter,
    );

    const result = await loader.load();

    expect(result.map((t) => t.description)).toEqual(['Coffee', 'Bread', 'Taxi', 'Rent']);
    expect(reporter.reportedFailures.map((f) => f.reason)).toEqual(
      expect.arrayContaining([
        'files processed: 3',
        'duplicates removed: 3',
      ]),
    );
  });
});
