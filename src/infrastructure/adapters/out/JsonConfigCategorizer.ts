import * as fs from 'fs';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

type Rule = { keywords: string[]; category: string };

const CONFIG_PATH = path.resolve(process.cwd(), 'categorization-rules.json');

export class JsonConfigCategorizer implements CategorizeTransactionPort {
  private rules: Rule[] | null = null;

  constructor() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.rules = parsed as Rule[];
        }
      }
    } catch {
      this.rules = null;
    }
  }

  categorize(tx: Transaction): string {
    if (this.rules && this.rules.length > 0) {
      const text = `${tx.description} ${tx.category}`.toLowerCase();
      for (const rule of this.rules) {
        if (rule.keywords.some((kw) => text.includes(kw))) {
          return rule.category;
        }
      }
    }
    return 'Others';
  }
}
