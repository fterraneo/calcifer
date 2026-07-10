import { Transaction } from '../model/Transaction';

export interface CategorizeTransactionPort {
  categorize(tx: Transaction): string;
}
