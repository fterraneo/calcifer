import * as td from 'testdouble';
import { Transaction } from '../../../core/domain/model/Transaction';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';
import { MultiFileExcelLoader } from './MultiFileExcelLoader';

const tx = (description: string, amount: number) =>
  new Transaction(new Date('2026-06-01'), description, '', amount, 'Others', 'EUR');

describe('MultiFileExcelLoader — Unit', () => {
  let reporter: ReportImportFailuresPort;

  beforeEach(() => {
    reporter = td.object<ReportImportFailuresPort>();
  });

  afterEach(() => {
    td.reset();
  });

  it('returns an empty list and reports zero counts when there are no files', async () => {
    const loader = new MultiFileExcelLoader([], reporter);

    const result = await loader.load();

    expect(result).toEqual([]);
    td.verify(reporter.report(td.matchers.argThat((f: { reason: string }[]) =>
      f.some((x) => x.reason === 'files processed: 0'))));
  });

  it('loads every source once', async () => {
    const source1 = td.object<LoadTransactionsPort>();
    const source2 = td.object<LoadTransactionsPort>();
    td.when(source1.load()).thenResolve([tx('A', -1)]);
    td.when(source2.load()).thenResolve([tx('B', -2)]);
    const loader = new MultiFileExcelLoader([source1, source2], reporter);

    await loader.load();

    td.verify(source1.load(), { times: 1 });
    td.verify(source2.load(), { times: 1 });
  });

  it('keeps the first occurrence of duplicate transactions and preserves order', async () => {
    const source1 = td.object<LoadTransactionsPort>();
    const source2 = td.object<LoadTransactionsPort>();
    td.when(source1.load()).thenResolve([tx('A', -1), tx('B', -2), tx('B', -2)]);
    td.when(source2.load()).thenResolve([tx('B', -2), tx('C', -3)]);
    const loader = new MultiFileExcelLoader([source1, source2], reporter);

    const result = await loader.load();

    expect(result.map((t) => t.description)).toEqual(['A', 'B', 'C']);
  });

  it('treats transactions differing in any field as distinct', async () => {
    const source = td.object<LoadTransactionsPort>();
    td.when(source.load()).thenResolve([
      new Transaction(new Date('2026-06-01'), 'A', '', -1, 'Others', 'EUR'),
      new Transaction(new Date('2026-06-01'), 'A', 'x', -1, 'Others', 'EUR'),
      new Transaction(new Date('2026-06-02'), 'A', '', -1, 'Others', 'EUR'),
    ]);
    const loader = new MultiFileExcelLoader([source], reporter);

    const result = await loader.load();

    expect(result).toHaveLength(3);
  });

  it('reports the number of files processed and duplicates removed', async () => {
    const source1 = td.object<LoadTransactionsPort>();
    const source2 = td.object<LoadTransactionsPort>();
    td.when(source1.load()).thenResolve([tx('A', -1), tx('A', -1)]);
    td.when(source2.load()).thenResolve([tx('A', -1)]);
    const loader = new MultiFileExcelLoader([source1, source2], reporter);

    await loader.load();

    td.verify(reporter.report(td.matchers.argThat((f: { reason: string }[]) =>
      f.some((x) => x.reason === 'files processed: 2') &&
      f.some((x) => x.reason === 'duplicates removed: 2'))));
  });
});
