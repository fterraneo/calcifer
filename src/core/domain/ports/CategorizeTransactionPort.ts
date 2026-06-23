import { Transaction } from '../model/Transaction';
import { Category } from '../model/Category';

export interface CategorizeTransactionPort {
  categorize(tx: Transaction): Category;
}
