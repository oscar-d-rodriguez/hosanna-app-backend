class MemoryCacheService {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const cached = this.store.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key, value, ttlSeconds) {
    const ttlMs = Math.max(1, ttlSeconds) * 1000;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

module.exports = new MemoryCacheService();
