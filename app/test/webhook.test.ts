import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/server/create-app.js";

const config = {
  line: {
    channelSecret: "secret",
    channelAccessToken: "token",
    allowedUserIds: ["U-allowed"]
  },
  todoist: {
    apiToken: "todoist-token",
    projectId: "1234567890",
    sections: [
      { id: "2345678901", name: "買うもの" },
      { id: "3456789012", name: "やること" }
    ]
  },
  server: {
    port: 3000,
    listStateTtlSeconds: 900
  }
};

const createSignature = (body: string): string =>
  createHmac("SHA256", config.line.channelSecret).update(body).digest("base64");

const buildPostbackBody = (data: string, replyToken = "reply-token") =>
  JSON.stringify({
    destination: "Ubot",
    events: [
      {
        type: "postback",
        replyToken,
        timestamp: 1712900000000,
        source: {
          type: "user",
          userId: "U-allowed"
        },
        postback: {
          data
        }
      }
    ]
  });

const buildTextBody = (text: string, replyToken = "reply-token") =>
  JSON.stringify({
    destination: "Ubot",
    events: [
      {
        type: "message",
        replyToken,
        timestamp: 1712900000000,
        source: {
          type: "user",
          userId: "U-allowed"
        },
        message: {
          id: "1",
          type: "text",
          text
        }
      }
    ]
  });

const createGateway = () => ({
  listActiveTasks: vi.fn().mockImplementation(async (sectionId?: string) => {
    if (sectionId === "2345678901") {
      return [{ id: "task-1", content: "牛乳を買う", sectionName: "買うもの" }];
    }

    if (sectionId === "3456789012") {
      return [{ id: "task-2", content: "ゴミを出す", sectionName: "やること" }];
    }

    return [
      { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
      { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
    ];
  }),
  listSections: vi.fn().mockReturnValue(config.todoist.sections),
  addTask: vi.fn().mockResolvedValue({
    id: "task-3",
    content: "洗剤を買う",
    sectionName: "買うもの"
  }),
  updateTask: vi.fn().mockResolvedValue({
    id: "task-1",
    content: "低脂肪牛乳を買う"
  }),
  completeTask: vi.fn().mockResolvedValue({
    id: "task-2",
    content: "ゴミを出す"
  }),
  deleteTask: vi.fn().mockResolvedValue({
    id: "task-2",
    content: "ゴミを出す"
  })
});

describe("POST /webhook", () => {
  it("rejects an invalid signature", async () => {
    const app = createApp(config);
    const body = JSON.stringify({
      destination: "Ubot",
      events: []
    });

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": "invalid"
      },
      body
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      errorMessage: "Invalid LINE webhook signature"
    });
  });

  it("accepts an authorized text command", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, { todoistGateway, listStateStore, messagingClient });
    const body = buildTextBody("みる");

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す"
        }
      ]
    });
    expect(listStateStore.save).toHaveBeenCalledWith("user:U-allowed", ["task-1", "task-2"]);
  });

  it("marks unauthorized users as rejected", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, { messagingClient });
    const body = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-blocked"
          },
          message: {
            id: "2",
            type: "text",
            text: "みる"
          }
        }
      ]
    });

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 0,
      repliedEvents: 1,
      events: [
        {
          status: "rejected",
          reason: "unauthorized-user",
          errorMessage: "この操作は許可されていないよ"
        }
      ]
    });
    consoleLogSpy.mockRestore();
  });

  it("returns 502 when Reply API fails", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockRejectedValue(new Error("reply failed"))
    };
    const app = createApp(config, { todoistGateway, listStateStore, messagingClient });
    const body = buildTextBody("みる");

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      errorMessage: "Failed to send LINE reply"
    });
  });

  it("starts list section selection from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const conversationStateStore = {
      save: vi.fn(),
      load: vi.fn().mockReturnValueOnce({ type: "awaiting-list-section" }).mockReturnValueOnce({ type: "awaiting-list-section" }),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      conversationStateStore,
      messagingClient
    });
    const body = buildPostbackBody("menu=list");

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "どのセクションを表示する？\n1. 買うもの\n2. やること"
        }
      ]
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-list-section"
    });
  });

  it("shows a filtered section list from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi.fn().mockReturnValueOnce({ type: "awaiting-list-section" }).mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });
    const body = buildPostbackBody("menu=list:section:2345678901");

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "[買うもの]\n1. 牛乳を買う"
        }
      ]
    });
    expect(listStateStore.save).toHaveBeenCalledWith("user:U-allowed", ["task-1"]);
    expect(conversationStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });

  it("starts and completes add conversation from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-add-section" })
        .mockReturnValueOnce({ type: "awaiting-add-content", sectionId: "2345678901" })
        .mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });

    const selectBody = buildPostbackBody("menu=add:section:2345678901", "reply-token-1");
    const titleBody = buildTextBody("洗剤を買う", "reply-token-2");

    const selectResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(selectBody)
      },
      body: selectBody
    });
    const titleResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(titleBody)
      },
      body: titleBody
    });

    expect(selectResponse.status).toBe(200);
    await expect(selectResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "買うもの に追加したいタスク名を送って"
        }
      ]
    });
    expect(titleResponse.status).toBe(200);
    await expect(titleResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "追加したよ [買うもの]: 洗剤を買う"
        }
      ]
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-add-content",
      sectionId: "2345678901"
    });
    expect(todoistGateway.addTask).toHaveBeenCalledWith("洗剤を買う", "2345678901");
  });

  it("starts and completes edit conversation from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-1"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-content", taskId: "task-1", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-content", taskId: "task-1", sectionId: "2345678901" })
        .mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });

    const sectionBody = buildPostbackBody("menu=edit:section:2345678901", "reply-token-1");
    const indexBody = buildTextBody("1", "reply-token-2");
    const contentBody = buildTextBody("低脂肪牛乳を買う", "reply-token-3");

    const sectionResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(sectionBody)
      },
      body: sectionBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });
    const contentResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(contentBody)
      },
      body: contentBody
    });

    await expect(sectionResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "[買うもの]\n1. 牛乳を買う\n\n買うもの で編集したい番号を送って"
        }
      ]
    });
    await expect(indexResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "新しい内容を送って\n削除したいなら「削除」って送って"
        }
      ]
    });
    await expect(contentResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "更新したよ: 低脂肪牛乳を買う"
        }
      ]
    });
    expect(listStateStore.save).toHaveBeenCalledWith("user:U-allowed", ["task-1"]);
  });

  it("deletes a task from edit conversation when the user sends 削除", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-1"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-content", taskId: "task-1", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-content", taskId: "task-1", sectionId: "2345678901" })
        .mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });

    const sectionBody = buildPostbackBody("menu=edit:section:2345678901", "reply-token-1");
    const indexBody = buildTextBody("1", "reply-token-2");
    const deleteBody = buildTextBody("削除", "reply-token-3");

    await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(sectionBody)
      },
      body: sectionBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });
    const deleteResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(deleteBody)
      },
      body: deleteBody
    });

    await expect(indexResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "新しい内容を送って\n削除したいなら「削除」って送って"
        }
      ]
    });
    await expect(deleteResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "削除したよ: ゴミを出す"
        }
      ]
    });
    expect(todoistGateway.deleteTask).toHaveBeenCalledWith("task-1");
    expect(listStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });

  it("starts and completes complete conversation from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-complete-section" })
        .mockReturnValueOnce({ type: "awaiting-complete-index", sectionId: "3456789012" })
        .mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });

    const sectionBody = buildPostbackBody("menu=complete:section:3456789012", "reply-token-1");
    const indexBody = buildTextBody("1", "reply-token-2");

    const sectionResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(sectionBody)
      },
      body: sectionBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });

    await expect(sectionResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "[やること]\n1. ゴミを出す\n\nやること で完了したい番号を送って"
        }
      ]
    });
    await expect(indexResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "完了したよ: ゴミを出す"
        }
      ]
    });
    expect(todoistGateway.completeTask).toHaveBeenCalledWith("task-2");
  });

  it("starts and completes delete conversation from rich menu postback", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-delete-section" })
        .mockReturnValueOnce({ type: "awaiting-delete-index", sectionId: "3456789012" })
        .mockReturnValueOnce(null),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      messagingClient
    });

    const sectionBody = buildPostbackBody("menu=delete:section:3456789012", "reply-token-1");
    const indexBody = buildTextBody("1", "reply-token-2");

    const sectionResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(sectionBody)
      },
      body: sectionBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });

    await expect(sectionResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "[やること]\n1. ゴミを出す\n\nやること で削除したい番号を送って"
        }
      ]
    });
    await expect(indexResponse.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "削除したよ: ゴミを出す"
        }
      ]
    });
    expect(todoistGateway.deleteTask).toHaveBeenCalledWith("task-2");
  });

  it("shows list preview from a state menu without ending the conversation", async () => {
    const todoistGateway = createGateway();
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn(),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" })
        .mockReturnValueOnce({ type: "awaiting-edit-index", sectionId: "2345678901" }),
      clear: vi.fn()
    };
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const conversationRichMenuManager = {
      sync: vi.fn().mockResolvedValue(undefined)
    };
    const app = createApp(config, {
      todoistGateway,
      listStateStore,
      conversationStateStore,
      conversationRichMenuManager,
      messagingClient
    });
    const body = buildPostbackBody("menu=list-preview");

    const response = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(body)
      },
      body
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      events: [
        {
          replyMessage: "[買うもの]\n1. 牛乳を買う"
        }
      ]
    });
    expect(listStateStore.save).toHaveBeenCalledWith("user:U-allowed", ["task-1"]);
    expect(conversationStateStore.clear).not.toHaveBeenCalled();
    expect(conversationRichMenuManager.sync).toHaveBeenCalledWith("U-allowed", {
      type: "awaiting-edit-index",
      sectionId: "2345678901"
    });
  });
});
