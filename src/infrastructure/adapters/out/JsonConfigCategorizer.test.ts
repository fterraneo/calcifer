import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { JsonConfigCategorizer } from './JsonConfigCategorizer';
import { Transaction } from '../../../core/domain/model/Transaction';

let seq = 0;
function tmpConfig(): string {
  seq += 1;
  return path.join(os.tmpdir(), `categorization-rules-${Date.now()}-${seq}.json`);
}

function tx(description: string, category: string, details = ''): Transaction {
  return new Transaction(new Date(), description, details, 0, category, 'EUR');
}

describe('JsonConfigCategorizer', () => {
  it('categorizes using a matching JSON rule', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('Pagamento EXAMPLE-GROCER', ''))).toBe('Grocery');
    fs.unlinkSync(configPath);
  });

  it('is case-insensitive', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['example-market'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('PAGAMENTO EXAMPLE-MARKET SUPERMERCATO', ''))).toBe('Grocery');
    fs.unlinkSync(configPath);
  });

  it('matches on input category when description has no match', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['alimentari'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('Some purchase', 'Generi Alimentari e Supermercato'))).toBe('Grocery');
    fs.unlinkSync(configPath);
  });

  it('prefers description match over input category match', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['example-streaming'], category: 'Recurring Payments' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('EXAMPLE-STREAMING', 'Film e Intrattenimento'))).toBe('Recurring Payments');
    fs.unlinkSync(configPath);
  });

  it('does not fall through to category when description already matches', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['supermercato'], category: 'Grocery' },
      { keywords: ['alimentari'], category: 'Food' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('Supermercato', 'Alimentari'))).toBe('Grocery');
    fs.unlinkSync(configPath);
  });

  it('matches on details when description does not match', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['abbonamento'], category: 'Recurring Payments' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('Generic payment', 'Misc', 'EXAMPLE-STREAMING abbonamento mensile'))).toBe('Recurring Payments');
    fs.unlinkSync(configPath);
  });

  it('integrates description and details for matching', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['example-market'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('', 'Misc', 'Pagamento EXAMPLE-MARKET'))).toBe('Grocery');
    fs.unlinkSync(configPath);
  });

  it('returns Others when no JSON rule matches', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, JSON.stringify([
      { keywords: ['example-grocer'], category: 'Grocery' },
    ]), 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('Unknown transaction', ''))).toBe('Others');
    fs.unlinkSync(configPath);
  });

  it('returns Others when the config file does not exist', () => {
    const categorizer = new JsonConfigCategorizer('/tmp/nonexistent-rules.json');
    expect(categorizer.categorize(tx('Anything', ''))).toBe('Others');
  });

  it('handles invalid JSON gracefully', () => {
    const configPath = tmpConfig();
    fs.writeFileSync(configPath, 'not json', 'utf-8');
    const categorizer = new JsonConfigCategorizer(configPath);
    expect(categorizer.categorize(tx('example-fuel', ''))).toBe('Others');
    fs.unlinkSync(configPath);
  });
});
