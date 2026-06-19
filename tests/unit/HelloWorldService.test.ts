import * as td from 'testdouble';
import { Greeting } from '../../src/core/domain/model/Greeting';
import { GreetingRepository } from '../../src/core/domain/ports/GreetingRepository';
import { HelloWorldService } from '../../src/core/application/HelloWorldService';

describe('HelloWorldService — Unit', () => {
  let mockRepo: GreetingRepository;
  let service: HelloWorldService;

  beforeEach(() => {
    mockRepo = td.object<GreetingRepository>();
    service = new HelloWorldService(mockRepo);
  });

  afterEach(() => {
    td.reset();
  });

  it('saves a greeting through the repository', async () => {
    const greeting = await service.greet();

    expect(greeting.message).toBe('Hello, Hexagonal World!');
    td.verify(mockRepo.save(greeting), { times: 1 });
  });

  it('returns null when no greeting has been saved', async () => {
    td.when(mockRepo.findLatest()).thenResolve(null);

    const result = await service.getLatestGreeting();

    expect(result).toBeNull();
  });

  it('returns the latest greeting when one exists', async () => {
    const existing = new Greeting('Ciao', 'it');
    td.when(mockRepo.findLatest()).thenResolve(existing);

    const result = await service.getLatestGreeting();

    expect(result).toEqual(existing);
  });
});
