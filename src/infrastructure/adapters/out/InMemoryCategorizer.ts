import { Transaction } from '../../../core/domain/model/Transaction';
import { Category } from '../../../core/domain/model/Category';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

export class InMemoryCategorizer implements CategorizeTransactionPort {
  constructor(private readonly fixedCategory: Category = 'Others') {}

  categorize(_tx: Transaction): Category {
    return this.fixedCategory;
  }
}
