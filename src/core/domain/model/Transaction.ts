export class Transaction {
  constructor(
    public readonly date: Date,
    public readonly description: string,
    public readonly details: string,
    public readonly amount: number,
    public readonly category: string,
    public readonly currency: string,
  ) {}
}
