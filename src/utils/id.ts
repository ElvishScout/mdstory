export class StableIdGenerator {
  counter: number;
  increment: number;
  used = new Set<string>();

  constructor(init?: number, increment?: number) {
    this.counter = init ?? 0;
    this.increment = increment ?? 1;
  }

  reserve(id: string) {
    this.used.add(id);
  }

  next() {
    let id: string;

    do {
      id = `id_${this.counter}`;
      this.counter += this.increment;
    } while (this.used.has(id));

    this.used.add(id);
    return id;
  }
}
