import { ExcelTransactionLoader } from './infrastructure/adapters/out/ExcelTransactionLoader';
import { GoogleSheetsTransactionWriter } from './infrastructure/adapters/out/GoogleSheetsTransactionWriter';
import { BankStatementService } from './core/application/BankStatementService';
import { TransactionUploadService } from './core/application/TransactionUploadService';

async function main(): Promise<void> {
  const loader = new ExcelTransactionLoader();

  const reportService = new BankStatementService(loader);
  const summaries = await reportService.summarizeByCategory();

  const labelWidth = Math.max(...summaries.map((s) => s.category.length), 'Category'.length);

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

  console.log('Uploading transactions to Google Sheets...');
  const uploadService = new TransactionUploadService(loader, new GoogleSheetsTransactionWriter());
  await uploadService.upload();
  console.log('Done.');
}

main();
