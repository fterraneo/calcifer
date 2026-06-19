# Bank Statement Report — Implementation Plan

**Goal:** Parse a home banking Excel file and print a shell report summing transaction amounts by category (both income and expenses).

## Context

**Excel file:** `export.xlsx` (project root), sheet `Lista Operazione`.  
Header row at index 18: `Data | Operazione | Dettagli | Conto o carta | Contabilizzazione | Categoria | Valuta | Importo`  
Data rows start at index 19. Date is an Excel serial number; amounts are floats (negative = expense, positive = income).

## Architecture Decisions

### Port introduced

**`LoadTransactionsPort`** (output/driven port) — `core/domain/ports/`
```ts
interface LoadTransactionsPort {
  load(): Promise<Transaction[]>
}
```

The domain defines what it needs from infrastructure; it does not know about Excel.

Implementations:
- `ExcelTransactionLoader` — `infrastructure/adapters/out/` — parses the xlsx file (file path hardcoded)
- `InMemoryTransactionLoader` — `infrastructure/adapters/out/` — seeded list, used in tests

**No output port for printing.** `BankStatementService` returns `CategorySummary[]`; `main.ts` renders the table. Printing is presentation logic, not application logic.

## Steps

Each step is one atomic, shippable commit.

- [x] Domain models: `Transaction`, `CategorySummary` — `core/domain/model/`
- [x] Port: `LoadTransactionsPort` — `core/domain/ports/`
- [x] `BankStatementService` + colocated unit test (testdouble mock) — `core/application/`
- [x] `InMemoryTransactionLoader` + acceptance test (`tests/acceptance/bank-statement.test.ts`)
- [x] `ExcelTransactionLoader` — parses xlsx using the `xlsx` library
- [x] Wire `main.ts`, move `xlsx` from devDependencies → dependencies

Check off each step (`[x]`) as it is completed.
