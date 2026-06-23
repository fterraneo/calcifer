import * as td from 'testdouble';
import { Transaction } from '../domain/model/Transaction';
import { LoadTransactionsPort } from '../domain/ports/LoadTransactionsPort';
import { SaveTransactionsPort } from '../domain/ports/SaveTransactionsPort';
import { TransactionUploadService } from './TransactionUploadService';

describe('TransactionUploadService — Unit', () => {
  let mockLoader: LoadTransactionsPort;
  let mockSaver: SaveTransactionsPort;
  let service: TransactionUploadService;

  beforeEach(() => {
    mockLoader = td.object<LoadTransactionsPort>();
    mockSaver = td.object<SaveTransactionsPort>();
    service = new TransactionUploadService(mockLoader, mockSaver);
  });

  afterEach(() => {
    td.reset();
  });

  it('loads transactions and passes them to the saver', async () => {
    const transactions = [
      new Transaction(new Date('2026-06-01'), 'Supermercato', 'Dettaglio A', -25.5, 'Generi alimentari', 'EUR'),
    ];
    td.when(mockLoader.load()).thenResolve(transactions);

    await service.upload();

    td.verify(mockSaver.save(transactions), { times: 1 });
  });

  it('uploads an empty list when there are no transactions', async () => {
    td.when(mockLoader.load()).thenResolve([]);

    await service.upload();

    td.verify(mockSaver.save([]), { times: 1 });
  });
});
