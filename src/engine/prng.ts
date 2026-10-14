/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-performance 32-bit Mulberry32 Seeded Pseudo-Random Number Generator.
 * Guarantees 100% deterministic reproducibility across runs with the same seed.
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed | 0;
  }

  public reseed(seed: number): void {
    this.state = seed | 0;
  }

  /**
   * Returns a pseudo-random floating point number in [0, 1).
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Binomial distribution draw: number of successes in n trials with probability p.
   * Uses direct Bernoulli trials for small n, or normal approximation with continuity correction for large n.
   */
  public binomial(n: number, p: number): number {
    if (n <= 0 || p <= 0) return 0;
    if (p >= 1) return n;

    // For smaller populations, compute exact binomial trials
    if (n < 50) {
      let count = 0;
      for (let i = 0; i < n; i++) {
        if (this.next() < p) count++;
      }
      return count;
    }

    // Gaussian approximation for large n
    const mean = n * p;
    const stdDev = Math.sqrt(n * p * (1 - p));
    if (stdDev < 1e-6) return Math.round(mean);

    // Box-Muller transform for standard normal sample
    const u1 = Math.max(1e-10, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const val = Math.round(mean + z * stdDev);
    return Math.max(0, Math.min(n, val));
  }

  /**
   * Poisson draw with parameter lambda
   */
  public poisson(lambda: number): number {
    if (lambda <= 0) return 0;
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= this.next();
      } while (p > L);
      return k - 1;
    }

    // Gaussian approximation for large lambda
    const u1 = Math.max(1e-10, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + z * Math.sqrt(lambda)));
  }
}
