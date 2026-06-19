import { HelloWorldService } from '../../src/core/application/HelloWorldService';
import { InMemoryGreetingRepository } from '../../src/infrastructure/adapters/out/InMemoryGreetingRepository';

describe('Hello World — Acceptance', () => {
  let service: HelloWorldService;

  beforeEach(() => {
    const repo = new InMemoryGreetingRepository();
    service = new HelloWorldService(repo);
  });

  it('returns a greeting message', async () => {
    const greeting = await service.greet();
    expect(greeting.message).toBe('Hello, Hexagonal World!');
    expect(greeting.language).toBe('en');
  });

  it('persists the greeting and retrieves it', async () => {
    await service.greet();
    const latest = await service.getLatestGreeting();
    expect(latest).not.toBeNull();
    expect(latest!.message).toBe('Hello, Hexagonal World!');
  });
});
