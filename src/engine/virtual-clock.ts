export interface ScheduledStep<T> {
  readonly at: number;
  readonly value: T;
}

export class VirtualClock<T> {
  readonly #steps: readonly ScheduledStep<T>[];
  #index = 0;
  #stopped = false;

  constructor(steps: readonly ScheduledStep<T>[]) {
    this.#steps = [...steps].sort((left, right) => left.at - right.at);
  }

  get now(): number {
    return this.#steps[Math.max(0, this.#index - 1)]?.at ?? 0;
  }

  get done(): boolean {
    return this.#index >= this.#steps.length;
  }

  stop(): void {
    this.#stopped = true;
  }

  reset(): void {
    this.#index = 0;
    this.#stopped = false;
  }

  next(): ScheduledStep<T> | undefined {
    if (this.#stopped || this.done) return undefined;
    const step = this.#steps[this.#index];
    this.#index += 1;
    return step;
  }
}
