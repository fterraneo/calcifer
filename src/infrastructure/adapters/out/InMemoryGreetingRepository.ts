import { Greeting, GreetingRepository } from '../../../core/domain';

export class InMemoryGreetingRepository implements GreetingRepository {
  private storage: Greeting[] = [];

  async save(greeting: Greeting): Promise<void> {
    this.storage.push(greeting);
  }

  async findLatest(): Promise<Greeting | null> {
    if (this.storage.length === 0) return null;
    return this.storage[this.storage.length - 1];
  }
}
