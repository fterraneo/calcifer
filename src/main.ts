import { InMemoryGreetingRepository } from './infrastructure/adapters/out/InMemoryGreetingRepository';
import { HelloWorldService } from './core/application/HelloWorldService';

async function main(): Promise<void> {
  const repo = new InMemoryGreetingRepository();
  const service = new HelloWorldService(repo);
  const greeting = await service.greet();
  console.log(greeting.message);
}

main();
