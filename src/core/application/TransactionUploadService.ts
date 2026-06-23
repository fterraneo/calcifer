import { LoadTransactionsPort } from '../domain/ports/LoadTransactionsPort';
import { SaveTransactionsPort } from '../domain/ports/SaveTransactionsPort';

export class TransactionUploadService {
  constructor(
    private readonly loadTransactions: LoadTransactionsPort,
    private readonly saveTransactions: SaveTransactionsPort,
  ) {}

  async upload(): Promise<void> {
    const transactions = await this.loadTransactions.load();
    await this.saveTransactions.save(transactions);
  }
}
