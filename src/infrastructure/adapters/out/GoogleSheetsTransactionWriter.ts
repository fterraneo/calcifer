import { google } from 'googleapis';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { SaveTransactionsPort } from '../../../core/domain/ports/SaveTransactionsPort';

const SPREADSHEET_ID = 'EXAMPLE_SPREADSHEET_ID';
const SHEET_NAME = 'Calcifer Transactions';
const KEY_FILE = path.resolve(process.cwd(), 'service-account.json');

const HEADER = ['Date', 'Description', 'Details', 'Amount', 'Category'];

const DATE_FORMAT = { type: 'DATE', pattern: 'YYYY-MM-DD' };
const ACCOUNTING_FORMAT = {
  type: 'NUMBER',
  pattern: '_(€* #,##0.00_);_(€* (#,##0.00);_(€* "-"??_);_(@_)',
};

function toSheetsSerial(date: Date): number {
  return Math.floor(date.getTime() / 86400000) + 25569;
}

export class GoogleSheetsTransactionWriter implements SaveTransactionsPort {
  async save(transactions: Transaction[]): Promise<void> {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${SHEET_NAME}!A1`;

    const rows = transactions.map((tx) => [
      toSheetsSerial(tx.date),
      tx.description,
      tx.details,
      tx.amount,
      tx.category,
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER, ...rows] },
    });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === SHEET_NAME,
    );
    const sheetId = sheet?.properties?.sheetId ?? 0;
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
              cell: { userEnteredFormat: { numberFormat: ACCOUNTING_FORMAT } },
              fields: 'userEnteredFormat.numberFormat',
            },
          },
        ],
      },
    });
  }
}
