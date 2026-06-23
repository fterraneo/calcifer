import { google } from 'googleapis';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { SaveTransactionsPort } from '../../../core/domain/ports/SaveTransactionsPort';

const SPREADSHEET_ID = 'EXAMPLE_SPREADSHEET_ID';
const SHEET_NAME = 'Calcifer Transactions';
const KEY_FILE = path.resolve(process.cwd(), 'service-account.json');

const HEADER = ['Date', 'Description', 'Details', 'Amount', 'Category'];

// dd/mm/yyyy — Italian date display format
const DATE_FORMAT = { type: 'DATE', pattern: 'dd/mm/yyyy' };

// € 1.234,56 for positives, € -50,13 for negatives (Italian locale rendering)
const AMOUNT_FORMAT = { type: 'NUMBER', pattern: '€ #,##0.00;€ -#,##0.00' };

function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10); // "2026-06-18" — universally parsed by Sheets
}

export class GoogleSheetsTransactionWriter implements SaveTransactionsPort {
  async save(transactions: Transaction[]): Promise<void> {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Clear existing content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });

    // 2. Write values — USER_ENTERED so Sheets parses ISO dates as date values
    const rows = transactions.map((tx) => [
      toIsoDateString(tx.date),
      tx.description,
      tx.details,
      tx.amount,
      tx.category,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADER, ...rows] },
    });

    // 3. Apply column formats
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetMeta = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === SHEET_NAME,
    );
    if (sheetMeta?.properties?.sheetId == null) {
      throw new Error(`Sheet "${SHEET_NAME}" not found in spreadsheet`);
    }
    const sheetId = sheetMeta.properties.sheetId;
    const dataRowCount = transactions.length + 1; // +1 for header

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 1, endRowIndex: dataRowCount, startColumnIndex: 0, endColumnIndex: 1 },
              cell: { userEnteredFormat: { numberFormat: DATE_FORMAT } },
              fields: 'userEnteredFormat.numberFormat',
            },
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 1, endRowIndex: dataRowCount, startColumnIndex: 3, endColumnIndex: 4 },
              cell: { userEnteredFormat: { numberFormat: AMOUNT_FORMAT } },
              fields: 'userEnteredFormat.numberFormat',
            },
          },
        ],
      },
    });
  }
}
