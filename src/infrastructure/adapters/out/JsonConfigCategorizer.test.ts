import * as fs from 'fs';
import * as path from 'path';
import { JsonConfigCategorizer } from './JsonConfigCategorizer';
import { Transaction } from '../../../core/domain/model/Transaction';

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
});

describe('JsonConfigCategorizer', () => {
  it('categorizes using a matching JSON rule', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Pagamento example-grocer', ''))).toBe('Grocery');
  });

  it('is case-insensitive', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('PAGAMENTO example-grocer SUPERMERCATO', ''))).toBe('Grocery');
  });

  it('matches on input category when description has no match', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['alimentari'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Some purchase', 'Generi Alimentari e Supermercato'))).toBe('Grocery');
  });

  it('prefers description match over input category match', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-streaming'], category: 'Recurring Payments' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('example-streaming', 'Film e Intrattenimento'))).toBe('Recurring Payments');
  });

  it('does not fall through to category when description already matches', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['supermercato'], category: 'Grocery' },
      { keywords: ['alimentari'], category: 'Food' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Supermercato', 'Alimentari'))).toBe('Grocery');
  });

  it('returns Others when no JSON rule matches', () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Unknown transaction', ''))).toBe('Others');
  });

  it('returns Others when JSON file does not exist', () => {
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('Anything', ''))).toBe('Others');
  });

  it('handles invalid JSON gracefully', () => {
    fs.writeFileSync(CONFIG_PATH, 'not json', 'utf-8');
    const categorizer = new JsonConfigCategorizer();
    expect(categorizer.categorize(tx('example-fuel', ''))).toBe('Others');
  });
});
