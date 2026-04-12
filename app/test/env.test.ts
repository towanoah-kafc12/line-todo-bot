import { describe, expect, it } from "vitest";

import { createConfig } from "../src/config/env.js";

const validEnv = {
  LINE_CHANNEL_SECRET: "secret",
  LINE_CHANNEL_ACCESS_TOKEN: "token",
  LINE_ALLOWED_USER_IDS: "U1,U2",
  TODOIST_API_TOKEN: "todoist-token",
  TODOIST_PROJECT_ID: "1234567890",
  TODOIST_SECTION_ID: "2345678901",
  PORT: "3000",
  LIST_STATE_TTL_SECONDS: "900"
};

describe("createConfig", () => {
  it("parses a valid environment", () => {
    const config = createConfig(validEnv);

    expect(config.line.allowedUserIds).toEqual(["U1", "U2"]);
    expect(config.server.port).toBe(3000);
    expect(config.server.listStateTtlSeconds).toBe(900);
  });

  it("fails when required values are missing", () => {
    expect(() =>
      createConfig({
        ...validEnv,
        TODOIST_API_TOKEN: ""
      })
    ).toThrow(/TODOIST_API_TOKEN is required/);
  });

  it("fails when the allowed user list is blank after trimming", () => {
    expect(() =>
      createConfig({
        ...validEnv,
        LINE_ALLOWED_USER_IDS: " , "
      })
    ).toThrow(/LINE_ALLOWED_USER_IDS must contain at least one user ID/);
  });
});
