import { describe, expect, it, vi } from "vitest";

import { handleCommand } from "../src/commands/handlers.js";

describe("handleCommand", () => {
  it("stores numbered list state and formats tasks", async () => {
    const gateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う" },
        { id: "task-2", content: "ゴミを出す" }
      ]),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      completeTask: vi.fn(),
      deleteTask: vi.fn()
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };

    await expect(
      handleCommand({
        command: { type: "list" },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("1. 牛乳を買う\n2. ゴミを出す");
    expect(listStateStore.save).toHaveBeenCalledWith("U1", ["task-1", "task-2"]);
  });

  it("returns an add success message", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      addTask: vi.fn().mockResolvedValue({ id: "task-1", content: "洗剤を買う" }),
      updateTask: vi.fn(),
      completeTask: vi.fn(),
      deleteTask: vi.fn()
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };

    await expect(
      handleCommand({
        command: { type: "add", content: "洗剤を買う" },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("追加したよ: 洗剤を買う");
  });

  it("uses stored numbering for complete, delete, and edit", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn().mockResolvedValue({ id: "task-2", content: "洗剤を補充" }),
      completeTask: vi.fn().mockResolvedValue({ id: "task-2", content: "洗剤を補充" }),
      deleteTask: vi.fn().mockResolvedValue({ id: "task-2", content: "洗剤を補充" })
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };

    await expect(
      handleCommand({
        command: { type: "complete", index: 2 },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("完了したよ: 洗剤を補充");

    await expect(
      handleCommand({
        command: { type: "delete", index: 2 },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("削除したよ: 洗剤を補充");

    await expect(
      handleCommand({
        command: { type: "edit", index: 2, content: "洗剤を補充" },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("更新したよ: 洗剤を補充");
  });

  it("returns a clear error when numbering is unavailable", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      completeTask: vi.fn(),
      deleteTask: vi.fn()
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue(null),
      clear: vi.fn()
    };

    await expect(
      handleCommand({
        command: { type: "complete", index: 9 },
        gateway,
        listStateStore,
        userId: "U1"
      }),
    ).resolves.toBe("番号が見つからないよ");
  });
});
