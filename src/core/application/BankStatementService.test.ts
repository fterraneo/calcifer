import * as td from 'testdouble';
import { Transaction } from '../domain/model/Transaction';
import { LoadTransactionsPort } from '../domain/ports/LoadTransactionsPort';
import { BankStatementService } from './BankStatementService';

describe('BankStatementService — Unit', () => {
  let mockLoader: LoadTransactionsPort;
  let service: BankStatementService;

  beforeEach(() => {
    mockLoader = td.object<LoadTransactionsPort>();
    service = new BankStatementService(mockLoader);
  });

  afterEach(() => {
    td.reset();
  });

  it('returns an empty list when there are no transactions', async () => {
    td.when(mockLoader.load()).thenResolve([]);

    const result = await service.summarizeByCategory();

    expect(result).toEqual([]);
  });

  it('groups transactions by category and sums amounts', async () => {
    td.when(mockLoader.load()).thenResolve([
      new Transaction(new Date(), 'Supermercato', -20, 'Generi alimentari', 'EUR'),
      new Transaction(new Date(), 'Farmacia', -30, 'Farmacia', 'EUR'),
      new Transaction(new Date(), 'Altro supermercato', -10, 'Generi alimentari', 'EUR'),
    ]);

    const result = await service.summarizeByCategory();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Generi alimentari', total: -30 }),
        expect.objectContaining({ category: 'Farmacia', total: -30 }),
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it('sorts results by total ascending (largest expense first)', async () => {
    td.when(mockLoader.load()).thenResolve([
      new Transaction(new Date(), 'example-transfer', -500, 'Viaggi', 'EUR'),
      new Transaction(new Date(), 'Bar', -5, 'Ristoranti', 'EUR'),
      new Transaction(new Date(), 'example-salary', 2000, 'Entrate', 'EUR'),
    ]);

    const result = await service.summarizeByCategory();

    expect(result[0].category).toBe('Viaggi');
    expect(result[1].category).toBe('Ristoranti');
    expect(result[2].category).toBe('Entrate');
  });
});
