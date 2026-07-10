import { Transaction } from '../../../core/domain/model/Transaction';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

export class InMemoryCategorizer implements CategorizeTransactionPort {
  constructor(private readonly fixedCategory: string = 'Others') {}

  categorize(_tx: Transaction): string {
    return this.fixedCategory;
  }
}
