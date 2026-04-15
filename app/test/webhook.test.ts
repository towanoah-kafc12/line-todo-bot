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
    const todoistGateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
        { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
      ]),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
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
    const messagingClient = {
      replyMessage: vi.fn().mockResolvedValue({})
    };
    const app = createApp(config, { todoistGateway, listStateStore, messagingClient });
    const body = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "1",
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
    expect(messagingClient.replyMessage).toHaveBeenCalledWith({
      replyToken: "reply-token",
      messages: [
        {
          type: "text",
          text: "[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す"
        }
      ]
    });
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
    expect(messagingClient.replyMessage).toHaveBeenCalledWith({
      replyToken: "reply-token",
      messages: [
        {
          type: "text",
          text: "この操作は許可されていないよ"
        }
      ]
    });
    expect(consoleLogSpy).toHaveBeenCalledWith("[webhook] processed events", {
      acceptedEvents: 0,
      rejectedEvents: 1,
      ignoredEvents: 0,
      replyableEvents: 1,
      eventSummaries: [
        {
          status: "rejected",
          reason: "unauthorized-user",
          userId: "U-blocked"
        }
      ]
    });
    consoleLogSpy.mockRestore();
  });

  it("returns 502 when Reply API fails", async () => {
    const todoistGateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" }
      ]),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
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
    const messagingClient = {
      replyMessage: vi.fn().mockRejectedValue(new Error("reply failed"))
    };
    const app = createApp(config, { todoistGateway, listStateStore, messagingClient });
    const body = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "1",
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

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      errorMessage: "Failed to send LINE reply"
    });
  });

  it("starts and completes edit conversation from rich menu postback", async () => {
    const todoistGateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
        { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
      ]),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
      addTask: vi.fn(),
      updateTask: vi.fn().mockResolvedValue({
        id: "task-2",
        content: "燃えるゴミを出す"
      }),
      completeTask: vi.fn(),
      deleteTask: vi.fn()
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi
        .fn()
        .mockReturnValueOnce({ type: "awaiting-edit-index" })
        .mockReturnValueOnce({ type: "awaiting-edit-content", taskId: "task-2" }),
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

    const postbackBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "postback",
          replyToken: "reply-token-1",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          postback: {
            data: "menu=edit"
          }
        }
      ]
    });
    const indexBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-2",
          timestamp: 1712900000001,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "2",
            type: "text",
            text: "2"
          }
        }
      ]
    });
    const contentBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-3",
          timestamp: 1712900000002,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "3",
            type: "text",
            text: "燃えるゴミを出す"
          }
        }
      ]
    });

    const postbackResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(postbackBody)
      },
      body: postbackBody
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

    expect(postbackResponse.status).toBe(200);
    await expect(postbackResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す\n\n編集したい番号を送って"
        }
      ]
    });
    expect(indexResponse.status).toBe(200);
    await expect(indexResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "新しい内容を送って"
        }
      ]
    });
    expect(contentResponse.status).toBe(200);
    await expect(contentResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "更新したよ: 燃えるゴミを出す"
        }
      ]
    });
    expect(listStateStore.save).toHaveBeenCalledWith("user:U-allowed", ["task-1", "task-2"]);
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-edit-index"
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-edit-content",
      taskId: "task-2"
    });
    expect(todoistGateway.updateTask).toHaveBeenCalledWith("task-2", "燃えるゴミを出す");
    expect(conversationStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });

  it("starts and completes add conversation from rich menu postback", async () => {
    const todoistGateway = {
      listActiveTasks: vi.fn(),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
      addTask: vi.fn().mockResolvedValue({
        id: "task-3",
        content: "洗剤を買う",
        sectionName: "買うもの"
      }),
      updateTask: vi.fn(),
      completeTask: vi.fn(),
      deleteTask: vi.fn()
    };
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
        .mockReturnValueOnce({ type: "awaiting-add-content", sectionId: "2345678901" }),
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

    const postbackBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "postback",
          replyToken: "reply-token-1",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          postback: {
            data: "menu=add"
          }
        }
      ]
    });
    const contentBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-2",
          timestamp: 1712900000001,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "2",
            type: "text",
            text: "1"
          }
        }
      ]
    });
    const titleBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-3",
          timestamp: 1712900000002,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "3",
            type: "text",
            text: "洗剤を買う"
          }
        }
      ]
    });

    const postbackResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(postbackBody)
      },
      body: postbackBody
    });
    const contentResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(contentBody)
      },
      body: contentBody
    });
    const titleResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(titleBody)
      },
      body: titleBody
    });

    expect(postbackResponse.status).toBe(200);
    await expect(postbackResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "どのセクションに追加する？\n1. 買うもの\n2. やること"
        }
      ]
    });
    expect(contentResponse.status).toBe(200);
    await expect(contentResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "買うもの に追加したいタスク名を送って"
        }
      ]
    });
    expect(titleResponse.status).toBe(200);
    await expect(titleResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "追加したよ [買うもの]: 洗剤を買う"
        }
      ]
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-add-section"
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-add-content",
      sectionId: "2345678901"
    });
    expect(todoistGateway.addTask).toHaveBeenCalledWith("洗剤を買う", "2345678901");
    expect(conversationStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });

  it("starts and completes complete conversation from rich menu postback", async () => {
    const todoistGateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
        { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
      ]),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      completeTask: vi.fn().mockResolvedValue({
        id: "task-2",
        content: "ゴミを出す",
        sectionName: "やること"
      }),
      deleteTask: vi.fn()
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi.fn().mockReturnValueOnce({ type: "awaiting-complete-index" }),
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

    const postbackBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "postback",
          replyToken: "reply-token",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          postback: {
            data: "menu=complete"
          }
        }
      ]
    });
    const indexBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-2",
          timestamp: 1712900000001,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "2",
            type: "text",
            text: "2"
          }
        }
      ]
    });

    const postbackResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(postbackBody)
      },
      body: postbackBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });

    expect(postbackResponse.status).toBe(200);
    await expect(postbackResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す\n\n完了したい番号を送って"
        }
      ]
    });
    expect(indexResponse.status).toBe(200);
    await expect(indexResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "完了したよ: ゴミを出す"
        }
      ]
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-complete-index"
    });
    expect(todoistGateway.completeTask).toHaveBeenCalledWith("task-2");
    expect(conversationStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });

  it("starts and completes delete conversation from rich menu postback", async () => {
    const todoistGateway = {
      listActiveTasks: vi.fn().mockResolvedValue([
        { id: "task-1", content: "牛乳を買う", sectionName: "買うもの" },
        { id: "task-2", content: "ゴミを出す", sectionName: "やること" }
      ]),
      listSections: vi.fn().mockReturnValue(config.todoist.sections),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      completeTask: vi.fn(),
      deleteTask: vi.fn().mockResolvedValue({
        id: "task-2",
        content: "ゴミを出す",
        sectionName: "やること"
      })
    };
    const listStateStore = {
      save: vi.fn(),
      resolve: vi.fn().mockReturnValue("task-2"),
      clear: vi.fn()
    };
    const conversationStateStore = {
      save: vi.fn(),
      load: vi.fn().mockReturnValueOnce({ type: "awaiting-delete-index" }),
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

    const postbackBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "postback",
          replyToken: "reply-token-1",
          timestamp: 1712900000000,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          postback: {
            data: "menu=delete"
          }
        }
      ]
    });
    const indexBody = JSON.stringify({
      destination: "Ubot",
      events: [
        {
          type: "message",
          replyToken: "reply-token-2",
          timestamp: 1712900000001,
          source: {
            type: "user",
            userId: "U-allowed"
          },
          message: {
            id: "2",
            type: "text",
            text: "2"
          }
        }
      ]
    });

    const postbackResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(postbackBody)
      },
      body: postbackBody
    });
    const indexResponse = await app.request("/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-line-signature": createSignature(indexBody)
      },
      body: indexBody
    });

    expect(postbackResponse.status).toBe(200);
    await expect(postbackResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "[買うもの]\n1. 牛乳を買う\n\n[やること]\n2. ゴミを出す\n\n削除したい番号を送って"
        }
      ]
    });
    expect(indexResponse.status).toBe(200);
    await expect(indexResponse.json()).resolves.toMatchObject({
      ok: true,
      acceptedEvents: 1,
      repliedEvents: 1,
      events: [
        {
          status: "accepted",
          userId: "U-allowed",
          replyMessage: "削除したよ: ゴミを出す"
        }
      ]
    });
    expect(conversationStateStore.save).toHaveBeenCalledWith("user:U-allowed", {
      type: "awaiting-delete-index"
    });
    expect(todoistGateway.deleteTask).toHaveBeenCalledWith("task-2");
    expect(conversationStateStore.clear).toHaveBeenCalledWith("user:U-allowed");
  });
});
