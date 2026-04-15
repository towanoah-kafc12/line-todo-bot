import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/create-app.js";

const config = {
  line: {
    channelSecret: "secret",
    channelAccessToken: "token",
    allowedUserIds: ["U1", "U2"]
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

describe("createApp", () => {
  it("returns a bootstrap status response", async () => {
    const app = createApp(config);
    const response = await app.request("/");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      name: "line-todo-bot",
      status: "bootstrap-ready",
      allowedUserCount: 2
    });
  });

  it("returns a health check response", async () => {
    const app = createApp(config);
    const response = await app.request("/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok"
    });
  });
});
