import { CategorizedTransactionLoader } from '../../src/infrastructure/adapters/out/CategorizedTransactionLoader';
import { InMemoryTransactionLoader } from '../../src/infrastructure/adapters/out/InMemoryTransactionLoader';
import { InMemoryCategorizer } from '../../src/infrastructure/adapters/out/InMemoryCategorizer';
import { Transaction } from '../../src/core/domain/model/Transaction';

describe('transaction categorization', () => {
  it('applies the custom category to all loaded transactions', async () => {
    const transactions = [
      new Transaction(new Date('2024-01-01'), 'EXAMPLE-SHOP', 'Supermercato', -30, 'Alimentari', 'EUR'),
      new Transaction(new Date('2024-01-02'), 'example-fuel', 'Carburante', -60, 'Carburanti', 'EUR'),
    ];
    const loader = new InMemoryTransactionLoader(transactions);
    const categorizer = new InMemoryCategorizer('Grocery');
    const subject = new CategorizedTransactionLoader(loader, categorizer);

    const result = await subject.load();

    expect(result).toHaveLength(2);
    expect(result.every((tx) => tx.category === 'Grocery')).toBe(true);
  });

  it('preserves all other transaction fields unchanged', async () => {
    const date = new Date('2024-03-15');
    const transactions = [new Transaction(date, 'EXAMPLE-STREAMING', 'Abbonamento mensile', -12.99, 'Servizi', 'EUR')];
    const loader = new InMemoryTransactionLoader(transactions);
    const categorizer = new InMemoryCategorizer('Recurring Payments');
    const subject = new CategorizedTransactionLoader(loader, categorizer);

    const [result] = await subject.load();

    expect(result.date).toEqual(date);
    expect(result.description).toBe('EXAMPLE-STREAMING');
    expect(result.details).toBe('Abbonamento mensile');
    expect(result.amount).toBe(-12.99);
    expect(result.currency).toBe('EUR');
    expect(result.category).toBe('Recurring Payments');
  });
});
