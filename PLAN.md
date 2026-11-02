# Calcifer — Feature Plans & Architecture

## Overview

Calcifer is a personal finance transaction manager that:
1. Parses a home banking Excel file (930+ transactions)
2. Categorizes transactions using JSON-based rules
3. Prints a monthly summary report to the shell
4. Uploads all transactions to Google Sheets with proper formatting

**Current status:** All features implemented and tested ✅  
**Test suite:** 38 tests passing across 12 test suites | Type-check clean

---

## Architecture Principles

- **Hexagonal (Ports & Adapters)**: Core domain has zero infrastructure dependencies
- **Dependency Inversion**: Core defines ports; adapters implement them
- **Decorator Pattern**: `CategorizedTransactionLoader` wraps the Excel loader for transparent categorization
- **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **Outside-In TDD**: Start with acceptance tests; use in-memory adapters
- **Colocated Unit Tests**: `*.test.ts` files placed alongside source files

**Key files:**
- `.github/copilot-instructions.md` — Detailed guidance for all agents
- `AGENTS.md` — Living document for architectural decisions
- `src/core/domain/` — Pure domain models & port interfaces (zero dependencies)
- `src/core/application/` — Stateless services (injection via constructor)
- `src/infrastructure/adapters/out/` — Concrete implementations (Excel, Sheets, JSON config, etc.)

---

## Feature 1: Category Summary Report ✅ COMPLETE

**Parse Excel and print shell report summarizing transactions by category, filtered by calendar month.**

### What it does
- Reads: `input-files/export.xlsx` (home banking export, 930 transactions)
- Parses: transaction date, description, details, amount, original category, currency
- Categorizes: via JSON-based rules in `categorization-rules.json` (see Feature 3)
- Reports: Two sections printed to shell:
  1. **Previous month** — all transactions from the 1st to the last day of prior month
  2. **Current month** — all transactions from the 1st of this month to today
- Format: Grouped by category, sorted by total ascending (largest expense first), with grand total

### Ports introduced

**`LoadTransactionsPort`** — `core/domain/ports/`
```ts
interface LoadTransactionsPort {
  load(): Promise<Transaction[]>;
}
```
Application defines the contract; adapters implement it.

### Domain models

- `Transaction` — date, description, details, amount, category, currency (all readonly)
- `CategorySummary` — category, total

### Adapters

- **`ExcelTransactionLoader`** — Production adapter, implements `LoadTransactionsPort`
  - Reads `input-files/export.xlsx` (hardcoded path)
  - Fixed: Bank's Excel export has corrupt `<dimension ref="A1:J33"/>` — adapter computes actual max row from cells
  - Error logging: Injects `ReportImportFailuresPort` to log parse errors to `import-failures.txt`
  
- **`InMemoryTransactionLoader`** — Test adapter with seeded transaction list

- **`FileImportFailureReporter`** — Logs parse errors to `import-failures.txt` (gitignored)
  - Called after parsing; file is deleted on clean run, created if errors occur

### Application service

**`BankStatementService`** — `core/application/`
```ts
class BankStatementService {
  constructor(private readonly loadTransactions: LoadTransactionsPort) {}
  async summarizeByCategory(since?: Date): Promise<CategorySummary[]> { ... }
}
```
- `since` parameter filters to transactions >= that date (defaults to all)
- Groups by category, sums amounts, sorts by total ascending (largest expense first)


---

## Feature 2: Upload Transactions to Google Sheets ✅ COMPLETE

**Upload all parsed transactions to a Google Sheet with proper formatting (Italian dates, EUR accounting).**

### What it does
- Uploads all transactions to a hardcoded Google Sheet
- Columns: Date (Italian dd/mm/yyyy), Description, Details, Amount (EUR accounting format with hyphen for negatives), Category
- Clears the sheet on every run and rewrites all rows from scratch
- Auth: Service account (JSON key file, gitignored at `service-account.json`)

### Port introduced

**`SaveTransactionsPort`** — `core/domain/ports/`
```ts
interface SaveTransactionsPort {
  save(transactions: Transaction[]): Promise<void>;
}
```

### Adapters

- **`GoogleSheetsTransactionWriter`** — Production adapter
  - Uses `googleapis` client library with service account auth
  - Spreadsheet ID from env var `GOOGLE_SHEETS_SPREADSHEET_ID` (required, no default)
  - Hardcoded sheet name: `Calcifer Transactions`
  - Flow: `values.clear` → `values.update` (USER_ENTERED, ISO date strings) → `batchUpdate(repeatCell)` for formats
  - Date format: `dd/mm/yyyy` (Italian)
  - Amount format: `€ #,##0.00;€ -#,##0.00` (euro + space, decimal point from locale, minus for negatives)

- **`InMemoryTransactionWriter`** — Test adapter, stores transactions in memory

### Application service

**`TransactionUploadService`** — `core/application/`
```ts
class TransactionUploadService {
  constructor(
    private readonly loadTransactions: LoadTransactionsPort,
    private readonly saveTransactions: SaveTransactionsPort,
  ) {}
  async upload(): Promise<void> { ... }
}
```
Loads via `LoadTransactionsPort`, saves via `SaveTransactionsPort`. No Sheets knowledge.

### Prerequisites
1. Create a Google Cloud project and enable the Google Sheets API
2. Create a Service Account, generate a JSON key, save as `service-account.json` (root, gitignored)
3. Share the target Google Sheet with the service account email (Editor access)

---

## Feature 3: JSON-Based Categorization Rules ✅ COMPLETE

**Load transaction categorization rules from external `categorization-rules.json` file instead of hardcoding them.**

### What it does
- Reads categorization rules from `categorization-rules.json` (gitignored, user-maintained)
- Rules are JSON array of objects: `{ keywords: string[], category: string }`
- Matching is case-insensitive keyword search:
  1. **First**: Match on description + details (combined lowercase text)
  2. **Fallback**: Match on original bank category (lowercase)
  3. **Default**: Return `'Others'` if no match
- Categories are fully dynamic (any string in the JSON becomes a valid category)
- Default path: `./categorization-rules.json` (cwd)
- Parametric: Can override path via `CATEGORIZATION_RULES_PATH` environment variable

### Port introduced

**`CategorizeTransactionPort`** — `core/domain/ports/`
```ts
interface CategorizeTransactionPort {
  categorize(tx: Transaction): string;
}
```

### Adapters

- **`JsonConfigCategorizer`** — Production adapter, implements `CategorizeTransactionPort`
  - Reads JSON from disk at construction time
  - Gracefully handles missing or malformed JSON (falls back to `Others` for all transactions)
  - Matching logic: lowercase keyword search, as described above

- **`InMemoryCategorizer`** — Test adapter, returns a fixed category for all transactions

- **`CategorizedTransactionLoader`** — **Decorator pattern**
  - Implements `LoadTransactionsPort`
  - Wraps another `LoadTransactionsPort` (e.g., `ExcelTransactionLoader`)
  - Injects `CategorizeTransactionPort` (e.g., `JsonConfigCategorizer`)
  - Returns transactions with derived categories (original category field is replaced)
  - Services (`BankStatementService`, `TransactionUploadService`) receive this decorator transparently

### Configuration

**`categorization-rules.json`** (gitignored example)
```json
[
  {
    "keywords": ["example-grocer", "example-market"],
    "category": "Grocery"
  },
  {
    "keywords": ["example-fuel"],
    "category": "(Car) Gasoline"
  },
  {
    "keywords": ["example-toll"],
    "category": "(Car) Tolls"
  },
  {
    "keywords": ["example-employer", "example-salary"],
    "category": "Salary"
  },
  {
    "keywords": ["example-utility"],
    "category": "Electricity Bill"
  },
  {
    "keywords": ["example-landlord"],
    "category": "House Rent"
  },
  {
    "keywords": ["example-streaming", "example-subscription"],
    "category": "Recurring Payments"
  }
]
```

---

## Development & Deployment

### Running the app

```bash
# Default: reads from ./categorization-rules.json
npm start

# Custom rules path:
CATEGORIZATION_RULES_PATH=/path/to/rules.json npm start
```

### Output
1. Prints two monthly reports to stdout (previous month + current month)
2. Uploads to Google Sheets
3. Import errors logged to `import-failures.txt` (if any)

### Testing

```bash
npm test              # Run all 38 tests (verbose)
npm test:watch       # Watch mode for development
npm run lint         # Type-check only (no emit)
```

### Git workflow

**Commits:**
- Author: `f.terraneo <f.terraneo@hotmail.com>` (via `--author` flag)
- Co-author: `Co-authored-by: <MODEL NAME> <email>` in message body
- Every commit is atomic (single logical change) and shippable (tests pass, type-check clean)

---

## Key Technical Decisions

### Excel parsing
- Uses `xlsx` library to parse Excel files
- **Bug fix** (commit `f804193`): Bank's export has corrupt dimension metadata (`!ref` pointing to row 33 when data goes to ~849). Adapter fixes this by computing actual max row from cells.

### Google Sheets formatting
- **Date**: Sent as ISO string (`YYYY-MM-DD`), displayed in Sheets as Italian format (`dd/mm/yyyy`)
- **Amount**: Negative amounts use a hyphen (not parentheses) per Italian accounting convention
  - Pattern: `€ #,##0.00;€ -#,##0.00` (currency + space, decimal point from locale)

### Month filtering
- Previous month: 1st of last month to last day of last month
- Current month: 1st of this month to today
- Both sections printed in a single run

### Error handling
- Parse errors logged to `import-failures.txt` (text file, overwritten per run)
- Invalid JSON rules → all transactions categorized as `'Others'` (graceful fallback)
- Missing `service-account.json` → upload fails with clear error

---

## Repository Structure

```
src/
  core/
    domain/
      model/
        Transaction.ts, CategorySummary.ts, ImportFailure.ts, Greeting.ts
      ports/
        LoadTransactionsPort.ts, SaveTransactionsPort.ts, CategorizeTransactionPort.ts,
        ReportImportFailuresPort.ts, GreetingRepository.ts
    application/
      BankStatementService.ts + .test.ts
      TransactionUploadService.ts + .test.ts
      HelloWorldService.ts + .test.ts (example/legacy)
  infrastructure/
    adapters/out/
      ExcelTransactionLoader.ts, GoogleSheetsTransactionWriter.ts,
      JsonConfigCategorizer.ts + .test.ts,
      CategorizedTransactionLoader.ts + .test.ts,
      FileImportFailureReporter.ts,
      InMemory* adapters for testing

tests/
  acceptance/
    bank-statement.test.ts — Feature 1 end-to-end
    transaction-upload.test.ts — Feature 2 end-to-end
    transaction-categorization.test.ts — Feature 3 decorator

.gitignore
  service-account.json (Google auth key)
  categorization-rules.json (user-maintained rules)
  import-failures.txt (parse error log)
  input-files/ (bank export files)

Configuration:
  .nvmrc — Node.js 20.15.0
  .github/copilot-instructions.md — AI assistant guidance
  AGENTS.md — Living document for architectural decisions
  PLAN.md — This file
```

---

## How to Add a New Feature

1. **Write an acceptance test** in `tests/acceptance/` using in-memory adapters
2. **Define domain models** in `src/core/domain/model/` (plain objects, no dependencies)
3. **Define ports** in `src/core/domain/ports/` (interfaces for the contract)
4. **Implement service** in `src/core/application/` (stateless, injected dependencies)
5. **Add unit tests** in the same file (colocated `*.test.ts`, use `testdouble` for mocking)
6. **Implement adapters** in `src/infrastructure/adapters/out/` (concrete implementations)
7. **Wire in `main.ts`** (compose services and adapters)
8. **Update `README.md`** (architecture diagram and any affected setup/usage docs) in the same commit as the port/adapter change
9. **Commit atomically** — each commit represents one step above and must pass tests

---

## Next Steps

- Consider adding validation for `categorization-rules.json` (e.g., warn if keywords are empty)
- Consider adding a sample `categorization-rules.json` in the repo (not gitignored) as a template

---

## Feature 4: Multi-File Loading with Deduplication ✅ COMPLETE

**Goal:** Load transactions from all top-level `.xlsx` files in `input-files/`, deduplicate across all files and within each file, and return a single ordered list of unique transactions.

### What was built
- **Deduplication**: key is all six fields (date as ISO string, description, details, amount, category, currency). First occurrence kept; order preserved.
- **`DeduplicatedTransactions`** (`core/domain/model/`): `{ unique: Transaction[], duplicateCount: number }`. Used internally by `MultiFileExcelLoader`; not exposed through the port.
- **`MultiFileExcelLoader`** (`infrastructure/adapters/out/`): implements `LoadTransactionsPort`. Takes a list of `LoadTransactionsPort` sources (one `ExcelTransactionLoader` per file) and a `ReportImportFailuresPort`.
- **Summary reporting**: files processed and duplicates removed are reported through `ReportImportFailuresPort` as entries with `rowIndex: 0`, since the port only accepts `ImportFailure`.
- **`ExcelTransactionLoader`**: file path and reader are constructor parameters (function-typed seam, no new port). `main.ts` passes each discovered file explicitly.
- **`main.ts`**: discovers `.xlsx` files in `input-files/` (sorted), builds one `ExcelTransactionLoader` per file, wraps them in `MultiFileExcelLoader`, then in `CategorizedTransactionLoader`.

### Reporting change
`ReportImportFailuresPort` gained `clear()`. `FileImportFailureReporter` now appends on each `report()` call (no-op for an empty list) and `main.ts` clears the file once at startup. Previously each call overwrote the file, so per-file parse errors and summaries would have replaced each other. `FileImportFailureReporter` takes an injectable report path for tests.

### Tests
- `tests/acceptance/multi-file-loading.test.ts`: three in-memory sources with duplicates within and across sources; asserts order, unique rows, and reported counts.
- `MultiFileExcelLoader.test.ts`: unit tests with `testdouble` mocks for sources and reporter.
- `FileImportFailureReporter.test.ts`: append, empty list, and clear, using a temp directory.

### Commits
1. `d62291a` ExcelTransactionLoader file path and reader injectable
2. `5401aba` DeduplicatedTransactions domain model
3. `9906b61` Reporter appends per run; clear at startup (port change)
4. `7e2bac0` MultiFileExcelLoader with acceptance and unit tests
5. `783b0d8` main.ts wiring and README

---

## Potential Features

- Budget limits and spending alerts
- Recurring transaction detection
- Multi-account support
- Expense forecasting
- Custom reports (by timerange, by tags, etc.)

