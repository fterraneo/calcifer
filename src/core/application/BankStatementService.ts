import { CategorySummary } from '../domain/model/CategorySummary';
import { LoadTransactionsPort } from '../domain/ports/LoadTransactionsPort';

export class BankStatementService {
  constructor(private readonly loadTransactions: LoadTransactionsPort) {}

  async summarizeByCategory(): Promise<CategorySummary[]> {
    const transactions = await this.loadTransactions.load();

    const totals = new Map<string, number>();
    for (const tx of transactions) {
      totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    }

    return Array.from(totals.entries())
      .map(([category, total]) => new CategorySummary(category, total))
      .sort((a, b) => a.total - b.total);
  }
}
