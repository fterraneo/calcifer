import { InMemoryGreetingRepository } from './infrastructure/adapters/out';
import { HelloWorldService } from './core/application';

async function main(): Promise<void> {
  const repo = new InMemoryGreetingRepository();
  const service = new HelloWorldService(repo);
  const greeting = await service.greet();
  console.log(greeting.message);
}

main();
