export class ImportFailure {
  constructor(
    public readonly rowIndex: number,
    public readonly reason: string,
  ) {}
}
