import * as XLSX from 'xlsx';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { ImportFailure } from '../../../core/domain/model/ImportFailure';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';
import { ReportImportFailuresPort } from '../../../core/domain/ports/ReportImportFailuresPort';

const FILE_PATH = path.resolve(process.cwd(), 'input-files/export.xlsx');
const DATA_START_INDEX = 19;

const COL = {
  DATE: 0,
  DESCRIPTION: 1,
  DETAILS: 2,
  CATEGORY: 5,
  CURRENCY: 6,
  AMOUNT: 7,
} as const;

function excelSerialToDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

export class ExcelTransactionLoader implements LoadTransactionsPort {
  constructor(private readonly failureReporter: ReportImportFailuresPort) {}

  async load(): Promise<Transaction[]> {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // The bank's export sets an incorrect <dimension> in the worksheet (e.g. A1:J33),
    // causing sheet_to_json to stop early. Expand !ref to the actual cell extent first.
    const actualMaxRow = Math.max(
      ...Object.keys(sheet)
        .filter((k) => !k.startsWith('!'))
        .map((k) => XLSX.utils.decode_cell(k).r),
    );
    const currentRange = XLSX.utils.decode_range(sheet['!ref']!);
    sheet['!ref'] = XLSX.utils.encode_range({ s: currentRange.s, e: { ...currentRange.e, r: actualMaxRow } });

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const transactions: Transaction[] = [];
    const failures: ImportFailure[] = [];
    rows.slice(DATA_START_INDEX).forEach((row, index) => {
      const rowIndex = DATA_START_INDEX + index + 1;
      try {
        const date = row[COL.DATE];
        const amount = row[COL.AMOUNT];
        if (date === null || date === undefined) throw new Error('missing date');
        if (amount === null || amount === undefined) throw new Error('missing amount');
        if (typeof date !== 'number') throw new Error(`invalid date value: ${date}`);
        if (typeof amount !== 'number') throw new Error(`invalid amount value: ${amount}`);

        transactions.push(new Transaction(
          excelSerialToDate(date),
          String(row[COL.DESCRIPTION] ?? '').trim(),
          String(row[COL.DETAILS] ?? '').trim(),
          amount,
          String(row[COL.CATEGORY] ?? '').trim(),
          String(row[COL.CURRENCY] ?? '').trim(),
        ));
      } catch (e) {
        failures.push(new ImportFailure(rowIndex, (e as Error).message));
      }
    });

    await this.failureReporter.report(failures);
    console.log('transactions', transactions.length);
    return transactions;
  }
}
