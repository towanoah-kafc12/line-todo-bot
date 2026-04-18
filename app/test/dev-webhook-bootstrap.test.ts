import { describe, expect, it } from "vitest";

// @ts-expect-error Local script module is exercised directly in tests.
import { extractTunnelUrl } from "../../scripts/dev-webhook-bootstrap.mjs";

describe("extractTunnelUrl", () => {
  it("returns a trycloudflare URL from wrangler output", () => {
    const output = [
      "Starting tunnel",
      "Visit your application at:",
      "https://fancy-bird-1234.trycloudflare.com"
    ].join("\n");

    expect(extractTunnelUrl(output)).toBe("https://fancy-bird-1234.trycloudflare.com");
  });

  it("returns null when no trycloudflare URL is present", () => {
    const output = "Tunnel is starting but the public URL is not ready yet";

    expect(extractTunnelUrl(output)).toBeNull();
  });
});
