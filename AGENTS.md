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
  unit/          # Unit tests — mock ports with testdouble
```

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
- **Unit tests** (`tests/unit/`): Test services in isolation. Use `testdouble` for mocking ports.
- Never import infrastructure (DB, HTTP, etc.) into tests/acceptance — only in-memory adapters.

## Git

- Author for commits: `f.terraneo <f.terraneo@hotmail.com>`
- Co-author: Use the current agent/model ID, e.g. `opencode/big-pickle <opencode@opencode.ai>` — replace `big-pickle` with whichever model is assisting
- Always use both in every commit via `--author` flag and `Co-authored-by:` trailer in the message.
- Commit every step — small, atomic commits that each represent a single logical change.
- Every commit must keep the project in a production-shippable state: all tests pass, type-check is clean, no broken functionality.

## Conventions

- Domain models: plain objects or simple classes, no decorators, no framework dependencies.
- Port interfaces: prefixed by role, e.g. `SaveGreetingPort`, `LoadGreetingPort`.
- Services: stateless, dependencies injected via constructor.
- Adapters: named by technology, e.g. `InMemoryGreetingRepository`, `PostgresGreetingRepository`.

