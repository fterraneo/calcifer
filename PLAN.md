# Bank Statement — Feature Plans

## Feature 1: Category Summary Report ✅ COMPLETE

Parse `export.xlsx` and print a shell report summing transactions by category.

**Port introduced:** `LoadTransactionsPort` (output) — `load(): Promise<Transaction[]>`  
**Adapters:** `ExcelTransactionLoader` (production), `InMemoryTransactionLoader` (tests)

---

## Feature 2: Upload Transactions to Google Sheets

**Goal:** Upload the list of parsed transactions to a Google Sheet.  
**Columns:** Date, Description, Details, Amount, Category  
**Behaviour:** Clear the sheet and rewrite all rows on every run.  
**Auth:** Service account (JSON key file at project root, shared with the target spreadsheet).

### Domain model change: add `details` to `Transaction`

The current `Transaction` model is missing the `details` field (Excel column "Dettagli", index 2).  
This must be added first — it is a prerequisite for all steps below.  
Required updates: `Transaction.ts`, `ExcelTransactionLoader.ts`, all tests that construct `Transaction`.

### Port introduced

**`SaveTransactionsPort`** (output/driven port) — `core/domain/ports/`
```ts
interface SaveTransactionsPort {
  save(transactions: Transaction[]): Promise<void>;
}
```
The application defines *what* it needs (save a list of transactions); it does not know about Sheets or HTTP.

Implementations:
- `GoogleSheetsTransactionWriter` — `infrastructure/adapters/out/` — calls the Sheets API; clears the range and rewrites header + rows
- `InMemoryTransactionWriter` — `infrastructure/adapters/out/` — stores transactions in memory; used in tests

### Application service

**`TransactionUploadService`** — `core/application/`
```ts
class TransactionUploadService {
  constructor(
    private readonly load: LoadTransactionsPort,
    private readonly save: SaveTransactionsPort,
  ) {}
  async upload(): Promise<void> { ... }
}
```
Loads via `LoadTransactionsPort`, saves via `SaveTransactionsPort`. No Google Sheets knowledge.

### Google Sheets setup (manual prerequisite for the user)

Before running, you need to:
1. Create a [Google Cloud project](https://console.cloud.google.com/) and enable the **Google Sheets API**.
2. Create a **Service Account**, generate a JSON key, and save it as `service-account.json` in the project root.
3. Share the target Google Sheet with the service account email (Editor access).
4. The spreadsheet ID and sheet/tab name are hardcoded in `GoogleSheetsTransactionWriter`.

`service-account.json` is listed in `.gitignore` — never commit it.

### Steps (each a shippable commit)

- [ ] Add `details` field to `Transaction`, update `ExcelTransactionLoader` and all affected tests
- [ ] Add `SaveTransactionsPort` — `core/domain/ports/`
- [ ] `TransactionUploadService` + colocated unit test (testdouble mock)
- [ ] `InMemoryTransactionWriter` + acceptance test
- [ ] `GoogleSheetsTransactionWriter` adapter (uses `googleapis`)
- [ ] Wire `main.ts`, add `googleapis` dependency, update `.gitignore`

