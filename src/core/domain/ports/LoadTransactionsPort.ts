import { Transaction } from '../model/Transaction';

export interface LoadTransactionsPort {
  load(): Promise<Transaction[]>;
}
