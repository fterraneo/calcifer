import { Transaction } from '../../src/core/domain/model/Transaction';
import { InMemoryTransactionLoader } from '../../src/infrastructure/adapters/out/InMemoryTransactionLoader';
import { InMemoryTransactionWriter } from '../../src/infrastructure/adapters/out/InMemoryTransactionWriter';
import { TransactionUploadService } from '../../src/core/application/TransactionUploadService';

describe('Transaction Upload — Acceptance', () => {
  it('uploads all loaded transactions to the writer', async () => {
    const transactions = [
      new Transaction(new Date('2026-06-01'), 'Supermercato', 'Dettaglio A', -25.5, 'Generi alimentari', 'EUR'),
      new Transaction(new Date('2026-06-02'), 'Farmacia', 'Dettaglio B', -37.1, 'Farmacia', 'EUR'),
    ];
    const loader = new InMemoryTransactionLoader(transactions);
    const writer = new InMemoryTransactionWriter();
    const service = new TransactionUploadService(loader, writer);

    await service.upload();

    expect(writer.savedTransactions).toHaveLength(2);
    expect(writer.savedTransactions[0].description).toBe('Supermercato');
    expect(writer.savedTransactions[0].details).toBe('Dettaglio A');
    expect(writer.savedTransactions[1].description).toBe('Farmacia');
  });
});
