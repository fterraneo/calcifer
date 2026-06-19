# Copilot Instructions — Calcifer

This document guides AI assistants through the Calcifer project structure, conventions, and development workflow.

## Quick Start

**Build, test, and lint:**
```bash
npm run build        # TypeScript compile
npm test             # Run all tests (verbose)
npm run test:watch   # Watch mode for development
npm run lint         # Type-check only (no emit)
npm run start        # Run the application (tsx src/main.ts)
```

**Run a single test:**
```bash
npm test -- tests/unit/HelloWorldService.test.ts
npm test -- tests/acceptance/hello-world.test.ts
```

## Architecture

**Hexagonal Architecture (Ports & Adapters)** with strict Dependency Inversion:

```
src/
  core/
    domain/
      model/           # Pure domain entities/value objects (zero dependencies)
      ports/           # Interfaces defining boundaries (input & output ports)
    application/       # Use cases / application services (depend only on domain ports)
  infrastructure/
    adapters/
      in/              # Inbound adapters (controllers, CLI, etc.)
      out/             # Outbound adapters (repositories, APIs, etc.)

tests/
  acceptance/          # Outside-in tests using in-memory adapters
  unit/                # Unit tests with mocked ports (testdouble)
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

**Acceptance tests** (`tests/acceptance/`):
- Test full use cases end-to-end
- Use in-memory adapters, never real infrastructure
- Write these first (Outside-In TDD)

**Unit tests** (`tests/unit/`):
- Test services in isolation
- Mock ports using `testdouble` (not hand-written mocks)
- Verify interactions with dependencies

**Example unit test with testdouble:**
```typescript
import * as td from 'testdouble';
import { GreetingRepository } from '../../src/core/domain/ports/GreetingRepository';

let mockRepo = td.object<GreetingRepository>();

// Stub behavior
td.when(mockRepo.findLatest()).thenResolve(null);

// Verify calls
td.verify(mockRepo.save(greeting), { times: 1 });

// Reset after test
td.reset();
```

## Git Workflow

**Commits:**
- Author: `f.terraneo <f.terraneo@hotmail.com>`
- Always include a Co-authored-by trailer with the assisting agent/model
- Example: `Co-authored-by: Claude Haiku <123456+claude-haiku@users.noreply.github.com>`
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
5. **Add unit tests**: Test services with mocked ports in `tests/unit/`

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
