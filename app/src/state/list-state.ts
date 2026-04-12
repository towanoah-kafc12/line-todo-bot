type StoredListState = {
  expiresAt: number;
  taskIds: string[];
};

type ListStateStoreOptions = {
  now?: () => number;
  ttlSeconds: number;
};

export class InMemoryListStateStore {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly states = new Map<string, StoredListState>();

  constructor({ now = Date.now, ttlSeconds }: ListStateStoreOptions) {
    this.now = now;
    this.ttlMs = ttlSeconds * 1000;
  }

  save(userId: string, taskIds: string[]): void {
    this.states.set(userId, {
      expiresAt: this.now() + this.ttlMs,
      taskIds: [...taskIds]
    });
  }

  resolve(userId: string, index: number): string | null {
    this.clearExpired();

    const state = this.states.get(userId);

    if (!state) {
      return null;
    }

    return state.taskIds[index - 1] ?? null;
  }

  clear(userId: string): void {
    this.states.delete(userId);
  }

  clearExpired(): void {
    const now = this.now();

    for (const [userId, state] of this.states.entries()) {
      if (state.expiresAt <= now) {
        this.states.delete(userId);
      }
    }
  }
}
