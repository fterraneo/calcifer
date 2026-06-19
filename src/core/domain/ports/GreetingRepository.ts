import { Greeting } from '../model/Greeting';

export interface GreetingRepository {
  save(greeting: Greeting): Promise<void>;
  findLatest(): Promise<Greeting | null>;
}
