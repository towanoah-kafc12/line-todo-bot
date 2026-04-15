export type ConversationState =
  | { type: "awaiting-list-section" }
  | { type: "awaiting-add-section" }
  | { type: "awaiting-add-content"; sectionId: string }
  | { type: "awaiting-edit-section" }
  | { type: "awaiting-edit-index"; sectionId: string }
  | { type: "awaiting-edit-content"; taskId: string; sectionId: string }
  | { type: "awaiting-complete-section" }
  | { type: "awaiting-complete-index"; sectionId: string }
  | { type: "awaiting-delete-section" }
  | { type: "awaiting-delete-index"; sectionId: string };

type StoredConversationState = {
  expiresAt: number;
  state: ConversationState;
};

type ConversationStateStoreOptions = {
  now?: () => number;
  ttlSeconds: number;
};

export class InMemoryConversationStateStore {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly states = new Map<string, StoredConversationState>();

  constructor({ now = Date.now, ttlSeconds }: ConversationStateStoreOptions) {
    this.now = now;
    this.ttlMs = ttlSeconds * 1000;
  }

  save(scopeKey: string, state: ConversationState): void {
    this.states.set(scopeKey, {
      expiresAt: this.now() + this.ttlMs,
      state
    });
  }

  load(scopeKey: string): ConversationState | null {
    this.clearExpired();

    return this.states.get(scopeKey)?.state ?? null;
  }

  clear(scopeKey: string): void {
    this.states.delete(scopeKey);
  }

  clearExpired(): void {
    const now = this.now();

    for (const [scopeKey, state] of this.states.entries()) {
      if (state.expiresAt <= now) {
        this.states.delete(scopeKey);
      }
    }
  }
}
