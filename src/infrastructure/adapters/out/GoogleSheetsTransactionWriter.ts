import { google } from 'googleapis';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { SaveTransactionsPort } from '../../../core/domain/ports/SaveTransactionsPort';

const SPREADSHEET_ID = 'EXAMPLE_SPREADSHEET_ID';
const SHEET_NAME = 'Calcifer Transactions';
const KEY_FILE = path.resolve(process.cwd(), 'service-account.json');

const HEADER = ['Date', 'Description', 'Details', 'Amount', 'Category'];

// DATE pattern - Google Sheets date format syntax (lowercase required)
const DATE_FORMAT = { type: 'DATE', pattern: 'yyyy-mm-dd' };

// Accounting pattern without embedded currency symbol — matches Google Sheets' built-in
// "Accounting" preset (currency symbol is derived from the spreadsheet locale)
const ACCOUNTING_FORMAT = {
  type: 'NUMBER',
  pattern: '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)',
};

function toSheetsSerial(date: Date): number {
  // Days since 1899-12-30 (Google Sheets epoch)
  return Math.floor(date.getTime() / 86400000) + 25569;
}

export class GoogleSheetsTransactionWriter implements SaveTransactionsPort {
  async save(transactions: Transaction[]): Promise<void> {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetMeta = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === SHEET_NAME,
    );
    if (sheetMeta?.properties?.sheetId == null) {
      throw new Error(`Sheet "${SHEET_NAME}" not found in spreadsheet`);
    }
    const sheetId = sheetMeta.properties.sheetId;

    const headerRow = {
      values: HEADER.map((h) => ({ userEnteredValue: { stringValue: h } })),
    };

    const dataRows = transactions.map((tx) => ({
      values: [
        {
          userEnteredValue: { numberValue: toSheetsSerial(tx.date) },
          userEnteredFormat: { numberFormat: DATE_FORMAT },
        },
        { userEnteredValue: { stringValue: tx.description } },
        { userEnteredValue: { stringValue: tx.details } },
        {
          userEnteredValue: { numberValue: tx.amount },
          userEnteredFormat: { numberFormat: ACCOUNTING_FORMAT },
        },
        { userEnteredValue: { stringValue: tx.category } },
      ],
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          // Clear all existing content and formatting
          {
            updateCells: {
              range: { sheetId },
              fields: 'userEnteredValue,userEnteredFormat',
            },
          },
          // Write header + data rows with values and formats in one shot
          {
            updateCells: {
              start: { sheetId, rowIndex: 0, columnIndex: 0 },
              rows: [headerRow, ...dataRows],
              fields: 'userEnteredValue,userEnteredFormat.numberFormat',
            },
          },
        ],
      },
    });
  }
}
