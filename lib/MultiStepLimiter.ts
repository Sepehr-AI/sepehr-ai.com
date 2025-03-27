import { RateLimiterMemory } from "rate-limiter-flexible";

export interface Step {
  points: number;
  duration: number;
}

export default class MultiStepLimiter {
  #limiters: RateLimiterMemory[];

  constructor(steps: Step[]) {
    this.#limiters = steps.map(
      (step, idx) =>
        new RateLimiterMemory({ ...step, keyPrefix: `step-${idx}-` })
    );
  }

  async consume(key: string, points: number = 1) {
    const consumedLimiters: RateLimiterMemory[] = [];
    try {
      for (const limiter of this.#limiters) {
        await limiter.consume(key, points);
        consumedLimiters.push(limiter);
      }
    } catch (error) {
      // Rollback consumption on all limiters that succeeded
      await Promise.all(
        consumedLimiters.map((limiter) => limiter.reward(key, points))
      );

      throw error;
    }
  }
}
