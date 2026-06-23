import { Transaction } from '../../../core/domain/model/Transaction';
import { SaveTransactionsPort } from '../../../core/domain/ports/SaveTransactionsPort';

export class InMemoryTransactionWriter implements SaveTransactionsPort {
  public savedTransactions: Transaction[] = [];

  async save(transactions: Transaction[]): Promise<void> {
    this.savedTransactions = [...transactions];
  }
}
