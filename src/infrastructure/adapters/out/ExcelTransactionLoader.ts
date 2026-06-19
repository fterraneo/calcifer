import * as XLSX from 'xlsx';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { LoadTransactionsPort } from '../../../core/domain/ports/LoadTransactionsPort';

const FILE_PATH = path.resolve(process.cwd(), 'export.xlsx');
const HEADER_ROW_INDEX = 18;
const DATA_START_INDEX = 19;

const COL = {
  DATE: 0,
  DESCRIPTION: 1,
  CATEGORY: 5,
  CURRENCY: 6,
  AMOUNT: 7,
} as const;

function excelSerialToDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

export class ExcelTransactionLoader implements LoadTransactionsPort {
  async load(): Promise<Transaction[]> {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    return rows
      .slice(DATA_START_INDEX)
      .filter((row) => row[COL.DATE] !== null && row[COL.AMOUNT] !== null)
      .map((row) => new Transaction(
        excelSerialToDate(row[COL.DATE] as number),
        String(row[COL.DESCRIPTION] ?? '').trim(),
        row[COL.AMOUNT] as number,
        String(row[COL.CATEGORY] ?? '').trim(),
        String(row[COL.CURRENCY] ?? '').trim(),
      ));
  }
}
