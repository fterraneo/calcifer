# Calcifer — Agent Guide

> This file is a living document. Keep it updated whenever a context, architectural, or conventional decision is made, so future sessions and agents stay aligned.

## Architecture

Hexagonal Architecture (Ports & Adapters) with strict Dependency Inversion:

```
src/
  core/
    domain/
      model/     # Pure domain entities/value objects (zero dependencies)
      ports/     # Interfaces defining boundaries (input & output ports)
    application/ # Use cases / application services (depend only on domain ports)
  infrastructure/
    adapters/
      in/        # Inbound adapters (controllers, CLI, etc.)
      out/       # Outbound adapters (repositories, APIs, etc.)
tests/
  acceptance/    # "Large" outside-in tests — use in-memory adapters
```

Unit tests are colocated with their source as `*.test.ts` (e.g. `src/core/application/*.test.ts`) and mock ports with `testdouble`.

## Principles

- **Hexagonal Architecture**: Core domain has zero infrastructure dependencies.
- **Dependency Inversion**: Core defines interfaces; adapters implement them.
- **SOLID**: Single responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion.
- **KISS**: Keep it simple — no premature abstractions.
- **Outside-In TDD**: Start with acceptance test → implement use case → stitch adapters.

## Development

```bash
npm run build        # TypeScript compile
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run lint         # Type-check only (no emit)
```

## Testing

- **Acceptance tests** (`tests/acceptance/`): Full use case flow via in-memory adapters. Write these first.
- **Unit tests** (colocated `*.test.ts`): Test services in isolation. Use `testdouble` for mocking ports.
- Never import infrastructure (DB, HTTP, etc.) into tests/acceptance — only in-memory adapters.

## Git

- Author for commits: `f.terraneo <f.terraneo@hotmail.com>`
- Co-author: use the identity of the model currently running the session, in the form `Co-authored-by: <Model Display Name> <noreply@<vendor-domain>>`. Do not hardcode a model name in this file. Example: `Co-authored-by: Claude Haiku 5.5 <noreply@anthropic.com>`
- Always use both in every commit via `--author` flag and `Co-authored-by:` trailer in the message.
- Commit every step — small, atomic commits that each represent a single logical change.
- Every commit must keep the project in a production-shippable state: all tests pass, type-check is clean, no broken functionality.

## Patterns Observed

### Decorator Pattern (Categorization)
`CategorizedTransactionLoader` wraps `LoadTransactionsPort` implementations:
```ts
const loader = new CategorizedTransactionLoader(
  new ExcelTransactionLoader(...),
  new JsonConfigCategorizer(...)
);
// loader implements LoadTransactionsPort and can be injected anywhere the interface is expected
```
This allows transparent categorization without modifying existing services.

### Configuration from Files
`JsonConfigCategorizer` reads JSON at construction time. Graceful degradation:
- File exists and valid JSON → use rules
- File missing or invalid JSON → fall back to default ('Others' for all)
- Exception handling in constructor prevents startup failure

### Environment Variables
Use `process.env` to parametrize paths and configuration:
```ts
const path = process.env.CATEGORIZATION_RULES_PATH ?? './categorization-rules.json';
```

## Documentation

`README.md` is the public entry point and must stay in sync with the code. Whenever you add, rename, or remove a port or a **production** adapter, update the Mermaid diagram under `## Architecture` in the same commit.

Diagram conventions:
- Show only domain ports (inside the hexagon) and production adapters that implement them.
- Omit application services.
- Omit in-memory/test adapters.
- Keep adapters pointing at the port they implement.

Also update `README.md` when setup, usage, scripts, or feature behavior changes.

---

