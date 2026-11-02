# Copilot Instructions — Calcifer

This document guides AI assistants through the Calcifer project structure, conventions, and development workflow.

## Quick Start

**Build, test, and lint:**
```bash
npm run build        # TypeScript compile
npm test             # Run all tests (verbose)
npm run test:watch   # Watch mode for development
npm run lint         # Type-check only (no emit)
npm start            # Run the application (tsx src/main.ts)
```

**Run the application:**
```bash
# Default: reads categorization rules from ./categorization-rules.json
npm start

# Custom rules path:
CATEGORIZATION_RULES_PATH=/path/to/rules.json npm start
```

**Output:**
- Two monthly reports printed to stdout (previous month + current month)
- Transactions uploaded to Google Sheets
- Parse errors logged to `import-failures.txt` (if any)

**Run a single test:**
```bash
npm test -- tests/acceptance/bank-statement.test.ts
npm test -- src/core/application/BankStatementService.test.ts
```

## Current Features

### Feature 1: Parse Excel & Print Monthly Report
- Input: all top-level `.xlsx` files in `input-files/` (home banking exports, loaded via `MultiFileExcelLoader`; transactions duplicated across or within files are counted once)
- Output: Shell table grouped by category, two sections (previous month + current month)
- Adapters: `ExcelTransactionLoader` (production), `InMemoryTransactionLoader` (tests)

### Feature 2: Upload to Google Sheets
- Uploads all transactions with Italian date format (dd/mm/yyyy) and EUR accounting amounts
- Columns: Date, Description, Details, Amount, Category
- Service account auth (gitignored: `service-account.json`)
- Spreadsheet ID: required env var `GOOGLE_SHEETS_SPREADSHEET_ID` (read by `GoogleSheetsTransactionWriter`; the run fails with a clear error if unset)
- Sheet name: `Calcifer Transactions`

### Feature 3: JSON-Based Categorization
- Rules file: `categorization-rules.json` (gitignored, user-maintained)
- Format: JSON array of `{keywords: string[], category: string}`
- Matching strategy (case-insensitive):
  1. First: search in (description + details) combined
  2. Fallback: search in original bank category
  3. Default: return `'Others'` if no match
- Categories are fully dynamic (any string in JSON becomes a valid category)
- Parametric path: `CATEGORIZATION_RULES_PATH` environment variable (default: `./categorization-rules.json`)
- Integration: `CategorizedTransactionLoader` decorator wraps Excel loader transparently

## Architecture

**Hexagonal Architecture (Ports & Adapters)** with strict Dependency Inversion:

```
src/
  core/
    domain/
      model/           # Pure domain entities/value objects (zero dependencies)
      ports/           # Interfaces defining boundaries (input & output ports)
    application/       # Use cases / application services (depend only on domain ports)
      *.test.ts        # Unit tests colocated with source
  infrastructure/
    adapters/
      in/              # Inbound adapters (controllers, CLI, etc.)
      out/             # Outbound adapters (repositories, APIs, etc.)

tests/
  acceptance/          # Outside-in tests using in-memory adapters
```

**Key principles:**
- Core domain has **zero infrastructure dependencies**
- Ports define boundaries; adapters implement them
- Services are stateless and depend on ports via constructor injection
- Apply SOLID principles, especially Dependency Inversion

## Conventions

### Domain Models
- Plain objects or simple classes
- No decorators or framework dependencies
- Immutable properties using readonly

### Ports (Interfaces)
- Named by role, not technology: `SaveGreetingPort`, `LoadGreetingPort`
- Defined in `core/domain/ports/`
- Represent a contract the domain requires

### Services (Application Layer)
- Stateless
- Dependencies injected via constructor
- Orchestrate use cases by working with domain models and ports
- Located in `core/application/`

### Adapters
- Implement ports
- Named by technology: `InMemoryGreetingRepository`, `PostgresGreetingRepository`
- Located in `infrastructure/adapters/in/` (input) or `infrastructure/adapters/out/` (output)
- Never imported directly by the domain or application layers

### Testing

**Unit tests** (`*.test.ts` colocated with source):
- Test services in isolation
- Mock ports using `testdouble` (not hand-written mocks)
- Verify interactions with dependencies
- Located alongside their source file (e.g., `src/core/application/BankStatementService.test.ts`)

**Acceptance tests** (`tests/acceptance/`):
- Test full use cases end-to-end
- Use in-memory adapters, never real infrastructure
- Write these first (Outside-In TDD)

**Example unit test with testdouble:**
```typescript
import * as td from 'testdouble';
import { LoadTransactionsPort } from '../../src/core/domain/ports/LoadTransactionsPort';

let mockLoader: LoadTransactionsPort;

afterEach(() => td.reset());

it('does something with loaded transactions', async () => {
  mockLoader = td.object<LoadTransactionsPort>();
  const mockTransactions = [/* ... */];
  
  td.when(mockLoader.load()).thenResolve(mockTransactions);
  
  // ... test code ...
  
  td.verify(mockLoader.load(), { times: 1 });
});
```

## Design Patterns in Use

### Decorator Pattern (Categorization)
The `CategorizedTransactionLoader` wraps any `LoadTransactionsPort` implementation and applies categorization transparently:
```typescript
const loader = new CategorizedTransactionLoader(
  new ExcelTransactionLoader(...),
  new JsonConfigCategorizer(...)
);
// loader implements LoadTransactionsPort and can be injected anywhere
```
Benefits:
- No changes needed to `BankStatementService` or `TransactionUploadService`
- Easy to swap categorizers (JSON-based, rule-based, ML-based, etc.)
- Can be unit-tested in isolation

### Configuration from External Files
`JsonConfigCategorizer` reads JSON rules at construction time:
- Graceful degradation: missing file → all transactions → `'Others'`
- Environment variable `CATEGORIZATION_RULES_PATH` overrides default location
- No startup failure if config is invalid — falls back to safe default

## Documentation

`README.md` is the public entry point and must stay in sync with the code. Whenever you add, rename, or remove a port or a **production** adapter, update the Mermaid diagram under `## Architecture` in the same commit.

Diagram conventions:
- Show only domain ports (inside the hexagon) and production adapters that implement them.
- Omit application services.
- Omit in-memory/test adapters.
- Keep adapters pointing at the port they implement.

Also update `README.md` when setup, usage, scripts, or feature behavior changes.

## Important Technical Notes

### Excel Parsing Bug Fix
The bank's Excel export has corrupt dimension metadata (`<dimension ref="A1:J33"/>` when data goes to row 849).  
Fix in `ExcelTransactionLoader`: Compute actual max row from cells and override `ws['!ref']` before calling `sheet_to_json`.

### Google Sheets Formatting
- **Date**: Sent as ISO string (YYYY-MM-DD), displayed in Sheets as Italian format (dd/mm/yyyy)
- **Amount**: Uses EUR symbol with space, minus (not parentheses) for negatives per Italian convention
  - Pattern: `€ #,##0.00;€ -#,##0.00`

### Month Filtering
- **Previous month**: 1st of last calendar month to last day
- **Current month**: 1st of this month to today
- Both printed in one run; both uploaded to Sheets (same sheet, all transactions)

### Error Handling
- Parse errors logged to `import-failures.txt` (overwritten per run)
- Invalid categorization JSON → all transactions → `'Others'` (no startup failure)
- Missing Google auth → upload fails with clear error

## Git Workflow

**Commits:**
- Author: `f.terraneo <f.terraneo@hotmail.com>`
- Always include a Co-authored-by trailer with the model currently running the session; follow the rule in `AGENTS.md` (`## Git`)
- Make small, atomic commits representing single logical changes
- Every commit must keep the project in a production-shippable state
- All tests pass, type-check is clean, no broken functionality

**Before committing:**
```bash
npm run lint          # Type-check passes
npm test              # All tests pass
npm run build         # Build succeeds (optional if using TS directly)
```

## Development Workflow

1. **Start with acceptance test**: Write the outside-in test in `tests/acceptance/`
2. **Implement the use case**: Add service and domain models in `core/`
3. **Define ports**: Create interfaces in `core/domain/ports/`
4. **Implement adapters**: Create concrete adapters in `infrastructure/adapters/`
5. **Add unit tests**: Colocate a `*.test.ts` file next to the source, mocking ports with `testdouble`

## Stack

- **Language**: TypeScript 5.8+
- **Testing**: Jest with ts-jest
- **Mocking**: testdouble
- **Runtime**: tsx (TypeScript executor for Node.js)

## Important Notes

- This is a hexagonal architecture project; avoid tight coupling to infrastructure
- When adding new features, maintain the clear separation between domain, application, and infrastructure
- Avoid mixing concerns: don't put business logic in adapters or repository implementations
- Use `testdouble` for port mocking in unit tests; it enforces the port contract at the type level
