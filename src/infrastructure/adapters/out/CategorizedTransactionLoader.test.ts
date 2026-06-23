import * as td from 'testdouble';
import { CategorizedTransactionLoader } from './CategorizedTransactionLoader';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';
import { Transaction } from '../../../core/domain/model/Transaction';

describe('CategorizedTransactionLoader', () => {
  let loader: LoadTransactionsPort;
  let categorizer: CategorizeTransactionPort;

  afterEach(() => td.reset());

  it('replaces transaction categories with the categorizer result', async () => {
    loader = td.object<LoadTransactionsPort>();
    categorizer = td.object<CategorizeTransactionPort>();

    const original = new Transaction(new Date('2024-01-01'), 'Groceries', 'example-grocer', -50, 'Alimentari', 'EUR');
    td.when(loader.load()).thenResolve([original]);
    td.when(categorizer.categorize(original)).thenReturn('Grocery');

    const subject = new CategorizedTransactionLoader(loader, categorizer);
    const result = await subject.load();

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Grocery');
    expect(result[0].description).toBe('Groceries');
    expect(result[0].amount).toBe(-50);
  });

  it('preserves all other transaction fields', async () => {
    loader = td.object<LoadTransactionsPort>();
    categorizer = td.object<CategorizeTransactionPort>();

    const date = new Date('2024-06-15');
    const original = new Transaction(date, 'example-streaming', 'Abbonamento', -12.99, 'Servizi', 'EUR');
    td.when(loader.load()).thenResolve([original]);
    td.when(categorizer.categorize(original)).thenReturn('Recurring Payments');

    const subject = new CategorizedTransactionLoader(loader, categorizer);
    const [result] = await subject.load();

    expect(result.date).toEqual(date);
    expect(result.description).toBe('example-streaming');
    expect(result.details).toBe('Abbonamento');
    expect(result.amount).toBe(-12.99);
    expect(result.currency).toBe('EUR');
    expect(result.category).toBe('Recurring Payments');
  });
});
