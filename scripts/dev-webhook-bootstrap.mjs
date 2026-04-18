import "dotenv/config";

import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { URL } from "node:url";

const lineApiBaseUrl = "https://api.line.me";
const defaultPort = Number.parseInt(process.env.PORT ?? "3000", 10);

export const extractTunnelUrl = (output) => {
  const normalizedOutput = output.replaceAll(String.fromCharCode(27), "");
  const match = normalizedOutput.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/iu);
  return match?.[0] ?? null;
};

const normalizeWebhookUrl = (baseUrl) => {
  const normalizedBaseUrl = baseUrl.trim().replace(/[)\],.;]+$/u, "");
  const url = new URL("/webhook", normalizedBaseUrl);
  return url.toString();
};

const isUsableWebhookBaseUrl = (value) => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.includes("xxxxx")) {
    return false;
  }

  return true;
};

const pipeOutput = (prefix, stream) => {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    process.stdout.write(`[${prefix}] ${chunk}`);
  });
};

const waitForServerReady = async (port, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  const targetUrl = `http://127.0.0.1:${port}/health`;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await globalThis.fetch(targetUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // The dev server isn't ready yet.
    }

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${targetUrl}`);
};

const requestLineApi = async (pathname, options = {}) => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required");
  }

  const response = await globalThis.fetch(new URL(pathname, lineApiBaseUrl), {
    ...options,
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE API request failed: ${response.status} ${response.statusText} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const setWebhookEndpoint = async (endpoint) => {
  await requestLineApi("/v2/bot/channel/webhook/endpoint", {
    method: "PUT",
    body: JSON.stringify({ endpoint })
  });
};

const getWebhookEndpoint = async () =>
  requestLineApi("/v2/bot/channel/webhook/endpoint", {
    method: "GET"
  });

const testWebhookEndpoint = async () =>
  requestLineApi("/v2/bot/channel/webhook/test", {
    method: "POST",
    body: JSON.stringify({})
  });

const waitForWebhookRegistration = async (webhookUrl) => {
  const retryDelaysMs = [0, 3_000, 5_000, 7_000, 9_000];
  let lastError = null;

  for (const [attemptIndex, delayMs] of retryDelaysMs.entries()) {
    if (delayMs > 0) {
      globalThis.console.log(`[bootstrap] waiting ${delayMs / 1000}s before retrying webhook registration`);
      await delay(delayMs);
    }

    try {
      globalThis.console.log(`[bootstrap] setting LINE webhook URL (attempt ${attemptIndex + 1}/${retryDelaysMs.length})`);
      await setWebhookEndpoint(webhookUrl);
      return;
    } catch (error) {
      lastError = error;
      globalThis.console.warn(`[bootstrap] webhook registration attempt ${attemptIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw lastError ?? new Error("Failed to register webhook URL");
};

const createCommandSpec = (command, args) => {
  if (process.platform === "win32") {
    const escapedArgs = args.map((arg) => `'${arg.replaceAll("'", "''")}'`).join(" ");
    const commandLine = [command, escapedArgs].filter((part) => part.length > 0).join(" ");

    return {
      command: "powershell.exe",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", commandLine]
    };
  }

  return { command, args };
};

const spawnProcess = (command, args, label) => {
  const commandSpec = createCommandSpec(command, args);
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  pipeOutput(label, child.stdout);
  pipeOutput(label, child.stderr);

  child.on("error", (error) => {
    globalThis.console.error(`[${label}] failed to start`, error);
  });

  return child;
};

const attachShutdown = (children) => {
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    globalThis.console.log(`\n[bootstrap] received ${signal}, stopping child processes`);

    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGINT");
      }
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

const waitForExit = (child, label) =>
  new Promise((resolve, reject) => {
    child.once("exit", (code, signal) => {
      resolve({ code, signal, label });
    });
    child.once("error", reject);
  });

const main = async () => {
  const devProcess = spawnProcess("npm", ["run", "dev"], "dev");

  await waitForServerReady(defaultPort);
  globalThis.console.log(`[bootstrap] dev server is reachable on http://127.0.0.1:${defaultPort}`);

  const tunnelCommandSpec = createCommandSpec("npx", [
    "wrangler",
    "tunnel",
    "quick-start",
    `http://localhost:${defaultPort}`
  ]);
  const tunnelProcess = spawn(tunnelCommandSpec.command, tunnelCommandSpec.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  let resolvedTunnelUrl = null;
  let outputBuffer = "";

  const handleTunnelChunk = (chunk) => {
    process.stdout.write(`[tunnel] ${chunk}`);
    outputBuffer += chunk;

    if (resolvedTunnelUrl !== null) {
      return;
    }

    const candidate = extractTunnelUrl(outputBuffer);

    if (candidate !== null) {
      resolvedTunnelUrl = candidate;
    }
  };

  tunnelProcess.stdout.setEncoding("utf8");
  tunnelProcess.stderr.setEncoding("utf8");
  tunnelProcess.stdout.on("data", handleTunnelChunk);
  tunnelProcess.stderr.on("data", handleTunnelChunk);

  attachShutdown([devProcess, tunnelProcess]);

  while (resolvedTunnelUrl === null) {
    if (tunnelProcess.exitCode !== null) {
      throw new Error("Tunnel process exited before a public URL was detected");
    }

    await delay(250);
  }

  const configuredBaseUrl = process.env.WEBHOOK_PUBLIC_BASE_URL;
  const publicBaseUrl = isUsableWebhookBaseUrl(configuredBaseUrl) ? configuredBaseUrl.trim() : resolvedTunnelUrl;
  const webhookUrl = normalizeWebhookUrl(publicBaseUrl);

  globalThis.console.log(`[bootstrap] detected tunnel URL: ${resolvedTunnelUrl}`);
  if (configuredBaseUrl?.trim()) {
    if (isUsableWebhookBaseUrl(configuredBaseUrl)) {
      globalThis.console.log(`[bootstrap] overriding detected tunnel URL with WEBHOOK_PUBLIC_BASE_URL=${configuredBaseUrl}`);
    } else {
      globalThis.console.warn(`[bootstrap] ignoring invalid WEBHOOK_PUBLIC_BASE_URL=${configuredBaseUrl}`);
    }
  }
  globalThis.console.log(`[bootstrap] normalized webhook URL: ${JSON.stringify(webhookUrl)}`);
  globalThis.console.log(`[bootstrap] updating LINE webhook URL to ${webhookUrl}`);

  await waitForWebhookRegistration(webhookUrl);

  const webhookInfo = await getWebhookEndpoint();
  const webhookTest = await testWebhookEndpoint();

  globalThis.console.log("[bootstrap] LINE webhook updated");
  globalThis.console.log(`[bootstrap] current endpoint: ${webhookInfo.endpoint}`);
  globalThis.console.log(`[bootstrap] webhook active: ${webhookInfo.active}`);
  globalThis.console.log(`[bootstrap] webhook test success: ${webhookTest.success}`);

  const firstExit = await Promise.race([
    waitForExit(devProcess, "dev"),
    waitForExit(tunnelProcess, "tunnel")
  ]);

  globalThis.console.log(`[bootstrap] ${firstExit.label} process exited`);

  if (firstExit.code && firstExit.code !== 0) {
    process.exitCode = firstExit.code;
  }
};

main().catch((error) => {
  globalThis.console.error("[bootstrap] failed", error);
  process.exitCode = 1;
});
