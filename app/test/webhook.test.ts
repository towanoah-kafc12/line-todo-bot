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
    sectionId: "2345678901"
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
          replyMessage: "1. 牛乳を買う\n2. ゴミを出す",
          command: {
            ok: true,
            command: {
              type: "list"
            }
          }
        }
      ]
    });
    expect(messagingClient.replyMessage).toHaveBeenCalledWith({
      replyToken: "reply-token",
      messages: [
        {
          type: "text",
          text: "1. 牛乳を買う\n2. ゴミを出す"
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
        { id: "task-1", content: "牛乳を買う" }
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
});
