import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, "..");
const richMenuDefinitionPath = path.join(repositoryRoot, "assets", "line", "default-rich-menu.json");
const richMenuImagePath = path.join(repositoryRoot, "assets", "line", "default-rich-menu.png");
const lineApiBaseUrl = "https://api.line.me";
const lineDataApiBaseUrl = "https://api-data.line.me";

const getChannelAccessToken = () => {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required");
  }

  return token;
};

const requestLineApi = async (pathname, options = {}, baseUrl = lineApiBaseUrl) => {
  const token = getChannelAccessToken();
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(
      `LINE API ${options.method ?? "GET"} ${pathname} failed: ${response.status} ${await response.text()}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const loadRichMenuDefinition = async () =>
  JSON.parse(await readFile(richMenuDefinitionPath, "utf8"));

const applyDefaultRichMenu = async () => {
  const richMenuDefinition = await loadRichMenuDefinition();
  const richMenuImage = await readFile(richMenuImagePath);
  const createResponse = await requestLineApi("/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(richMenuDefinition)
  });
  const richMenuId = createResponse.richMenuId;

  await requestLineApi(`/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      "content-type": "image/png"
    },
    body: richMenuImage
  }, lineDataApiBaseUrl);

  await requestLineApi(`/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST"
  });

  console.log("Default rich menu applied", {
    richMenuId,
    definition: richMenuDefinitionPath,
    image: richMenuImagePath
  });
};

const listRichMenus = async () => {
  const response = await requestLineApi("/v2/bot/richmenu/list");

  console.log(JSON.stringify(response, null, 2));
};

const clearDefaultRichMenu = async () => {
  await requestLineApi("/v2/bot/user/all/richmenu", {
    method: "DELETE"
  });

  console.log("Default rich menu cleared");
};

const deleteRichMenu = async (richMenuId) => {
  if (!richMenuId) {
    throw new Error("richMenuId is required for delete");
  }

  await requestLineApi(`/v2/bot/richmenu/${richMenuId}`, {
    method: "DELETE"
  });

  console.log("Rich menu deleted", { richMenuId });
};

const command = process.argv[2];

switch (command) {
  case "apply-default":
    await applyDefaultRichMenu();
    break;
  case "list":
    await listRichMenus();
    break;
  case "clear-default":
    await clearDefaultRichMenu();
    break;
  case "delete":
    await deleteRichMenu(process.argv[3]);
    break;
  default:
    console.error(
      [
        "Usage:",
        "  node scripts/line-rich-menu.mjs apply-default",
        "  node scripts/line-rich-menu.mjs list",
        "  node scripts/line-rich-menu.mjs clear-default",
        "  node scripts/line-rich-menu.mjs delete <richMenuId>"
      ].join("\n"),
    );
    process.exitCode = 1;
}
