import { Transaction } from '../../../core/domain/model/Transaction';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

export class CategorizedTransactionLoader implements LoadTransactionsPort {
  constructor(
    private readonly loader: LoadTransactionsPort,
    private readonly categorizer: CategorizeTransactionPort,
  ) {}

  async load(): Promise<Transaction[]> {
    const transactions = await this.loader.load();
    return transactions.map(
      (tx) =>
        new Transaction(tx.date, tx.description, tx.details, tx.amount, this.categorizer.categorize(tx), tx.currency),
    );
  }
}
