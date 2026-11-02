import { Transaction } from '../../src/core/domain/model/Transaction';
import { InMemoryTransactionLoader } from '../../src/infrastructure/adapters/out/InMemoryTransactionLoader';
import { BankStatementService } from '../../src/core/application/BankStatementService';

describe('Bank Statement — Acceptance', () => {
  it('summarizes all transactions by category', async () => {
    const transactions = [
      new Transaction(new Date('2026-06-01'), 'Supermercato', '', -25.5, 'Generi alimentari', 'EUR'),
      new Transaction(new Date('2026-06-02'), 'Farmacia', '', -37.1, 'Farmacia', 'EUR'),
      new Transaction(new Date('2026-06-03'), 'Altro supermercato', '', -4.5, 'Generi alimentari', 'EUR'),
      new Transaction(new Date('2026-06-04'), 'EXAMPLE-SALARY', '', 2000, 'Entrate', 'EUR'),
    ];
    const loader = new InMemoryTransactionLoader(transactions);
    const service = new BankStatementService(loader);

    const summaries = await service.summarizeByCategory();

    expect(summaries).toHaveLength(3);
    expect(summaries[0]).toEqual(expect.objectContaining({ category: 'Farmacia', total: -37.1 }));
    expect(summaries[1]).toEqual(expect.objectContaining({ category: 'Generi alimentari', total: -30 }));
    expect(summaries[2]).toEqual(expect.objectContaining({ category: 'Entrate', total: 2000 }));
  });

  it('filters transactions older than the given date', async () => {
    const transactions = [
      new Transaction(new Date('2026-01-01'), 'Vecchio', '', -50, 'Pasato', 'EUR'),
      new Transaction(new Date('2026-06-10'), 'Recente', '', -30, 'Attuale', 'EUR'),
    ];
    const loader = new InMemoryTransactionLoader(transactions);
    const service = new BankStatementService(loader);

    const summaries = await service.summarizeByCategory(new Date('2026-06-01'));

    expect(summaries).toHaveLength(1);
    expect(summaries[0].category).toBe('Attuale');
    expect(summaries[0].total).toBe(-30);
  });
});
