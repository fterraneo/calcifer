import * as path from 'path';
import { ExcelTransactionLoader } from './infrastructure/adapters/out/ExcelTransactionLoader';
import { CategorizedTransactionLoader } from './infrastructure/adapters/out/CategorizedTransactionLoader';
import { JsonConfigCategorizer } from './infrastructure/adapters/out/JsonConfigCategorizer';
import { FileImportFailureReporter } from './infrastructure/adapters/out/FileImportFailureReporter';
import { GoogleSheetsTransactionWriter } from './infrastructure/adapters/out/GoogleSheetsTransactionWriter';
import { BankStatementService } from './core/application/BankStatementService';
import { TransactionUploadService } from './core/application/TransactionUploadService';

async function main(): Promise<void> {
  const failureReporter = new FileImportFailureReporter();
  await failureReporter.clear();

  const loader = new CategorizedTransactionLoader(
    new ExcelTransactionLoader(failureReporter),
    new JsonConfigCategorizer(process.env.CATEGORIZATION_RULES_PATH ?? path.resolve(process.cwd(), 'categorization-rules.json')),
  );

  const reportService = new BankStatementService(loader);
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  async function printReport(monthStart: Date, title: string): Promise<void> {
    const summaries = await reportService.summarizeByCategory(monthStart);
    const labelWidth = Math.max(...summaries.map((s) => s.category.length), 'Category'.length);

    console.log('');
    console.log(title);
    console.log('');
    console.log(`${'Category'.padEnd(labelWidth)}   Amount (EUR)`);
    console.log(`${'-'.repeat(labelWidth)}   -------------`);
    for (const s of summaries) {
      const amount = s.total.toFixed(2).padStart(13);
      console.log(`${s.category.padEnd(labelWidth)}   ${amount}`);
    }
    console.log(`${'-'.repeat(labelWidth)}   -------------`);
    const grandTotal = summaries.reduce((sum, s) => sum + s.total, 0);
    console.log(`${'TOTAL'.padEnd(labelWidth)}   ${grandTotal.toFixed(2).padStart(13)}`);
    console.log('');
  }

  await printReport(previousMonth, `Report for ${previousMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`);
  await printReport(currentMonth, `Current month (${currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`);

  console.log('Uploading transactions to Google Sheets...');
  const uploadService = new TransactionUploadService(loader, new GoogleSheetsTransactionWriter());
  await uploadService.upload();
  console.log('Done.');
}

main();
