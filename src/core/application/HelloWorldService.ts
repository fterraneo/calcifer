import { Greeting } from '../domain/model/Greeting';
import { GreetingRepository } from '../domain/ports/GreetingRepository';

export class HelloWorldService {
  constructor(private readonly greetingRepository: GreetingRepository) {}

  async greet(): Promise<Greeting> {
    const greeting = new Greeting('Hello, Hexagonal World!', 'en');
    await this.greetingRepository.save(greeting);
    return greeting;
  }

  async getLatestGreeting(): Promise<Greeting | null> {
    return this.greetingRepository.findLatest();
  }
}
