/**
 * Lightweight in-memory LRU/TTL cache.
 * Avoids adding external dependencies while providing fast
 * access to deterministic tool results.
 *
 * @module lib/cache
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxKeys: number;
  private readonly ttlMs: number;

  constructor(maxKeys: number = 1000, ttlMs: number = 60 * 60 * 1000) {
    this.maxKeys = maxKeys;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxKeys) {
      // Delete oldest entry (Map iterates in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
