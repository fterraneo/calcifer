import { google } from 'googleapis';
import * as path from 'path';
import { Transaction } from '../../../core/domain/model/Transaction';
import { SaveTransactionsPort } from '../../../core/domain/ports/SaveTransactionsPort';

const SPREADSHEET_ID = 'EXAMPLE_SPREADSHEET_ID';
const SHEET_NAME = 'Calcifer Transactions';
const KEY_FILE = path.resolve(process.cwd(), 'service-account.json');

const HEADER = ['Date', 'Description', 'Details', 'Amount', 'Category'];

export class GoogleSheetsTransactionWriter implements SaveTransactionsPort {
  async save(transactions: Transaction[]): Promise<void> {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${SHEET_NAME}!A1`;

    const rows = transactions.map((tx) => [
      tx.date.toISOString().slice(0, 10),
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
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADER, ...rows] },
    });
  }
}
