import { Transaction } from '../../../core/domain/model/Transaction';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';

export class InMemoryTransactionLoader implements LoadTransactionsPort {
  constructor(private readonly transactions: Transaction[] = []) {}

  async load(): Promise<Transaction[]> {
    return this.transactions;
  }
}
