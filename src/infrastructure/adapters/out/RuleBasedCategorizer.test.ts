import { RuleBasedCategorizer } from './RuleBasedCategorizer';
import { Transaction } from '../../../core/domain/model/Transaction';

function tx(description: string, category: string): Transaction {
  return new Transaction(new Date(), description, '', 0, category, 'EUR');
}

describe('RuleBasedCategorizer', () => {
  const categorizer = new RuleBasedCategorizer();

  it('categorizes grocery by description keyword', () => {
    expect(categorizer.categorize(tx('Pagamento example-grocer', ''))).toBe('Grocery');
  });

  it('categorizes grocery by original category', () => {
    expect(categorizer.categorize(tx('Some purchase', 'Generi Alimentari e Supermercato'))).toBe('Grocery');
  });

  it('categorizes gasoline by description keyword', () => {
    expect(categorizer.categorize(tx('Pagamento example-fuel distributore', ''))).toBe('(Car) Gasoline');
  });

  it('categorizes tolls by description keyword', () => {
    expect(categorizer.categorize(tx('Pagamento example-toll', ''))).toBe('(Car) Tolls');
  });

  it('categorizes salary by description keyword', () => {
    expect(categorizer.categorize(tx('Accredito example-salary', ''))).toBe('Salary');
  });

  it('categorizes electricity bill by description keyword', () => {
    expect(categorizer.categorize(tx('Pagamento example-utility', ''))).toBe('Electricity Bill');
  });

  it('categorizes house rent by description keyword', () => {
    expect(categorizer.categorize(tx('Canone example-rent', ''))).toBe('House Rent');
  });

  it('categorizes recurring payment by description keyword', () => {
    expect(categorizer.categorize(tx('example-streaming abbonamento', ''))).toBe('Recurring Payments');
  });

  it('defaults to Others when no rule matches', () => {
    expect(categorizer.categorize(tx('Unknown transaction', 'Unknown'))).toBe('Others');
  });

  it('is case-insensitive', () => {
    expect(categorizer.categorize(tx('PAGAMENTO example-grocer SUPERMERCATO', ''))).toBe('Grocery');
  });
});
