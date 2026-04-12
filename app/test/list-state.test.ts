import { describe, expect, it, vi } from "vitest";

import { InMemoryListStateStore } from "../src/state/list-state.js";

describe("InMemoryListStateStore", () => {
  it("resolves a 1-based index for a user", () => {
    const store = new InMemoryListStateStore({
      ttlSeconds: 60,
      now: () => 1_000
    });

    store.save("U1", ["task-1", "task-2", "task-3"]);

    expect(store.resolve("U1", 2)).toBe("task-2");
  });

  it("returns null when the state is missing or out of range", () => {
    const store = new InMemoryListStateStore({
      ttlSeconds: 60,
      now: () => 1_000
    });

    store.save("U1", ["task-1"]);

    expect(store.resolve("U2", 1)).toBeNull();
    expect(store.resolve("U1", 9)).toBeNull();
  });

  it("expires old state entries", () => {
    const now = vi.fn(() => 1_000);
    const store = new InMemoryListStateStore({
      ttlSeconds: 1,
      now
    });

    store.save("U1", ["task-1"]);
    now.mockReturnValue(2_001);

    expect(store.resolve("U1", 1)).toBeNull();
  });

  it("clears a user state explicitly", () => {
    const store = new InMemoryListStateStore({
      ttlSeconds: 60,
      now: () => 1_000
    });

    store.save("U1", ["task-1"]);
    store.clear("U1");

    expect(store.resolve("U1", 1)).toBeNull();
  });
});
