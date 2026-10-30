import { Transaction } from './Transaction';

export interface DeduplicatedTransactions {
  readonly unique: Transaction[];
  readonly duplicateCount: number;
}
