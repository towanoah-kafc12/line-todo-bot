import { describe, expect, it, vi } from "vitest";

import { handleCommand } from "../src/commands/handlers.js";

describe("handleCommand", () => {
  it("stores numbered list state and formats tasks", async () => {
    const gateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
        { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
      ]),
      listSections: vi.fn().mockReturnValue([
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
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
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す");
    expect(listStateStore.save).toHaveBeenCalledWith("user:U1", ["task-1", "task-2"]);
  });

  it("returns an add guidance message when multiple sections exist", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      listSections: vi.fn().mockReturnValue([
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ]),
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
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("追加ボタンからセクションを選んでね");
  });

  it("uses stored numbering for complete, delete, and edit", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      listSections: vi.fn().mockReturnValue([
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ]),
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
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("完了したよ: 洗剤を補充");

    await expect(
      handleCommand({
        command: { type: "delete", index: 2 },
        gateway,
        listStateStore,
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("削除したよ: 洗剤を補充");

    await expect(
      handleCommand({
        command: { type: "edit", index: 2, content: "洗剤を補充" },
        gateway,
        listStateStore,
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("更新したよ: 洗剤を補充");
  });

  it("returns a clear error when numbering is unavailable", async () => {
    const gateway = {
      listActiveTasks: vi.fn(),
      listSections: vi.fn().mockReturnValue([
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ]),
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
        scopeKey: "user:U1"
      }),
    ).resolves.toBe("番号が見つからないよ");
  });
});
