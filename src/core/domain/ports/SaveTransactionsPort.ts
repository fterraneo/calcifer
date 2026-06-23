import { Transaction } from '../model/Transaction';

export interface SaveTransactionsPort {
  save(transactions: Transaction[]): Promise<void>;
}
