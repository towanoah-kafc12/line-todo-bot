import { describe, expect, it, vi } from "vitest";

import { createConversationRichMenuManager } from "../src/line/conversation-rich-menu.js";

describe("conversation rich menu manager", () => {
  it("links the list menu while section selection is active", async () => {
    const client = {
      getRichMenuAlias: vi.fn().mockResolvedValue({
        richMenuId: "richmenu-list"
      }),
      linkRichMenuIdToUser: vi.fn().mockResolvedValue(undefined),
      unlinkRichMenuIdFromUser: vi.fn().mockResolvedValue(undefined)
    };
    const manager = createConversationRichMenuManager(client);

    await manager.sync("U1", {
      type: "awaiting-list-section"
    });

    expect(client.getRichMenuAlias).toHaveBeenCalledWith("todo-list");
    expect(client.linkRichMenuIdToUser).toHaveBeenCalledWith("U1", "richmenu-list");
  });

  it("links the add menu while add conversation is active", async () => {
    const client = {
      getRichMenuAlias: vi.fn().mockResolvedValue({
        richMenuId: "richmenu-add"
      }),
      linkRichMenuIdToUser: vi.fn().mockResolvedValue(undefined),
      unlinkRichMenuIdFromUser: vi.fn().mockResolvedValue(undefined)
    };
    const manager = createConversationRichMenuManager(client);

    await manager.sync("U1", {
      type: "awaiting-add-section"
    });

    expect(client.getRichMenuAlias).toHaveBeenCalledWith("todo-add");
    expect(client.linkRichMenuIdToUser).toHaveBeenCalledWith("U1", "richmenu-add");
    expect(client.unlinkRichMenuIdFromUser).not.toHaveBeenCalled();
  });

  it("unlinks the user menu while complete index selection is active", async () => {
    const client = {
      getRichMenuAlias: vi.fn(),
      linkRichMenuIdToUser: vi.fn(),
      unlinkRichMenuIdFromUser: vi.fn().mockResolvedValue(undefined)
    };
    const manager = createConversationRichMenuManager(client);

    await manager.sync("U1", {
      type: "awaiting-complete-index",
      sectionId: "section-1"
    });

    expect(client.getRichMenuAlias).not.toHaveBeenCalled();
    expect(client.linkRichMenuIdToUser).not.toHaveBeenCalled();
    expect(client.unlinkRichMenuIdFromUser).toHaveBeenCalledWith("U1");
  });

  it("unlinks the user menu when conversation ends", async () => {
    const client = {
      getRichMenuAlias: vi.fn(),
      linkRichMenuIdToUser: vi.fn(),
      unlinkRichMenuIdFromUser: vi.fn().mockResolvedValue(undefined)
    };
    const manager = createConversationRichMenuManager(client);

    await manager.sync("U1", null);

    expect(client.unlinkRichMenuIdFromUser).toHaveBeenCalledWith("U1");
  });

  it("falls back to a no-op manager when rich menu methods are unavailable", async () => {
    const manager = createConversationRichMenuManager({
      replyMessage: vi.fn()
    });

    await expect(
      manager.sync("U1", {
        type: "awaiting-edit-index",
        sectionId: "section-1"
      }),
    ).resolves.toBeUndefined();
  });
});
