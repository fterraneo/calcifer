import * as fs from 'fs';
import * as path from 'path';
import * as td from 'testdouble';
import { JsonConfigCategorizer } from './JsonConfigCategorizer';
import { Transaction } from '../../../core/domain/model/Transaction';
import { CategorizeTransactionPort } from '../../../core/domain/ports/CategorizeTransactionPort';

const CONFIG_PATH = path.resolve(process.cwd(), 'categorization-rules.json');

function tx(description: string, category: string): Transaction {
  return new Transaction(new Date(), description, '', 0, category, 'EUR');
}

afterEach(() => {
  try {
    fs.unlinkSync(CONFIG_PATH);
  } catch {
    // ignore
  }
  td.reset();
});

describe('JsonConfigCategorizer', () => {
  it('categorizes using a matching JSON rule', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Pagamento example-grocer', ''))).toBe('Grocery');
  });

  it('falls back when no JSON rule matches', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const fallback = td.object<CategorizeTransactionPort>();
    td.when(fallback.categorize(td.matchers.anything())).thenReturn('Salary');
    const categorizer = new JsonConfigCategorizer(fallback);
    expect(categorizer.categorize(tx('Unknown', ''))).toBe('Salary');
  });

  it('uses JSON rule over fallback when JSON matches', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const fallback = td.object<CategorizeTransactionPort>();
    const categorizer = new JsonConfigCategorizer(fallback);
    expect(categorizer.categorize(tx('Pagamento example-grocer', ''))).toBe('Grocery');
    td.verify(fallback.categorize(td.matchers.anything()), { times: 0 });
  });

  it('falls back when JSON file is missing', () => {
    const fallback = td.object<CategorizeTransactionPort>();
    td.when(fallback.categorize(td.matchers.anything())).thenReturn('Salary');
    const categorizer = new JsonConfigCategorizer(fallback);
    expect(categorizer.categorize(tx('Anything', ''))).toBe('Salary');
  });

  it('is case-insensitive', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('PAGAMENTO example-grocer SUPERMERCATO', ''))).toBe('Grocery');
  });

  it('searches both description and original category', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['alimentari'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Some purchase', 'Generi Alimentari e Supermercato'))).toBe('Grocery');
  });

  it('returns Others with no JSON file and no fallback', () => {
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Something', ''))).toBe('Others');
  });

  it('handles invalid JSON gracefully and falls back', () => {
    fs.writeFileSync(CONFIG_PATH, 'not json', 'utf-8');
    const fallback = td.object<CategorizeTransactionPort>();
    td.when(fallback.categorize(td.matchers.anything())).thenReturn('(Car) Gasoline');
    const categorizer = new JsonConfigCategorizer(fallback);
    expect(categorizer.categorize(tx('example-fuel', ''))).toBe('(Car) Gasoline');
  });
});
