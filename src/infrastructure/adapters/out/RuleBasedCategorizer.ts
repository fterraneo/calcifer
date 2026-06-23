import { Transaction } from '../../../core/domain/model/Transaction';
import { Category } from '../../../core/domain/model/Category';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

type Rule = { keywords: string[]; category: Category };

const RULES: Rule[] = [
  {
    keywords: ['supermercato', 'grocery', 'alimentari', 'example-grocer', 'example-grocer', 'example-grocer', 'example-grocer', 'example-grocer', 'example-grocer', 'example-grocer', 'example-grocer'],
    category: 'Grocery',
  },
  {
    keywords: ['carburante', 'carburanti', 'gasoline', 'benzina', 'gasolio', 'example-fuel', 'ip ', 'example-fuel', 'example-fuel', 'example-fuel', 'total', 'shell', 'distributore'],
    category: '(Car) Gasoline',
  },
  {
    keywords: ['example-toll', 'example-toll', 'pedaggi', 'pedaggio', 'toll', 'tolls'],
    category: '(Car) Tolls',
  },
  {
    keywords: ['example-salary', 'salary', 'example-salary', 'accredito example-salary', 'example-transfer example-salary'],
    category: 'Salary',
  },
  {
    keywords: ['example-utility', 'example-utility', 'example-utility', 'luce', 'corrente elettrica', 'electricity', 'electric bill', 'bolletta luce'],
    category: 'Electricity Bill',
  },
  {
    keywords: ['example-rent', 'canone example-rent', 'example-rent', 'rent', 'house rent'],
    category: 'House Rent',
  },
  {
    keywords: ['example-streaming', 'example-streaming', 'example-streaming', 'example-streaming', 'abbonamento', 'subscription', 'recurring'],
    category: 'Recurring Payments',
  },
];

export class RuleBasedCategorizer implements CategorizeTransactionPort {
  categorize(tx: Transaction): Category {
    const text = `${tx.description} ${tx.category}`.toLowerCase();
    for (const rule of RULES) {
      if (rule.keywords.some((kw) => text.includes(kw))) {
        return rule.category;
      }
    }
    return 'Others';
  }
}
