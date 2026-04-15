import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, "..");
const lineApiBaseUrl = "https://api.line.me";
const lineDataApiBaseUrl = "https://api-data.line.me";
const richMenus = [
  {
    key: "main",
    aliasId: "todo-main",
    definitionPath: path.join(repositoryRoot, "assets", "line", "default-rich-menu.json"),
    imagePath: path.join(repositoryRoot, "assets", "line", "default-rich-menu.png")
  },
  {
    key: "add",
    aliasId: "todo-add",
    definitionPath: path.join(repositoryRoot, "assets", "line", "add-rich-menu.json"),
    imagePath: path.join(repositoryRoot, "assets", "line", "add-rich-menu.png")
  },
  {
    key: "edit",
    aliasId: "todo-edit",
    definitionPath: path.join(repositoryRoot, "assets", "line", "edit-rich-menu.json"),
    imagePath: path.join(repositoryRoot, "assets", "line", "edit-rich-menu.png")
  },
  {
    key: "complete",
    aliasId: "todo-complete",
    definitionPath: path.join(repositoryRoot, "assets", "line", "complete-rich-menu.json"),
    imagePath: path.join(repositoryRoot, "assets", "line", "complete-rich-menu.png")
  },
  {
    key: "delete",
    aliasId: "todo-delete",
    definitionPath: path.join(repositoryRoot, "assets", "line", "delete-rich-menu.json"),
    imagePath: path.join(repositoryRoot, "assets", "line", "delete-rich-menu.png")
  }
];

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

const loadRichMenuDefinition = async (definitionPath) =>
  JSON.parse(await readFile(definitionPath, "utf8"));

const upsertRichMenuAlias = async (richMenuAliasId, richMenuId) => {
  try {
    await requestLineApi("/v2/bot/richmenu/alias", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        richMenuAliasId,
        richMenuId
      })
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    await requestLineApi(`/v2/bot/richmenu/alias/${richMenuAliasId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        richMenuId
      })
    });
  }
};

const applyAllRichMenus = async () => {
  const appliedMenus = [];

  for (const richMenu of richMenus) {
    const richMenuDefinition = await loadRichMenuDefinition(richMenu.definitionPath);
    const richMenuImage = await readFile(richMenu.imagePath);
  const createResponse = await requestLineApi("/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(richMenuDefinition)
  });
    const richMenuId = createResponse.richMenuId;

    await requestLineApi(
      `/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: "POST",
        headers: {
          "content-type": "image/png"
        },
        body: richMenuImage
      },
      lineDataApiBaseUrl,
    );

    await upsertRichMenuAlias(richMenu.aliasId, richMenuId);
    appliedMenus.push({
      aliasId: richMenu.aliasId,
      richMenuId,
      definition: richMenu.definitionPath,
      image: richMenu.imagePath
    });
  }

  await requestLineApi(`/v2/bot/user/all/richmenu/${appliedMenus[0].richMenuId}`, {
    method: "POST"
  });

  console.log(
    "Conversation rich menus applied",
    JSON.stringify(
      {
        defaultRichMenuId: appliedMenus[0].richMenuId,
        menus: appliedMenus
      },
      null,
      2,
    ),
  );
};

const listRichMenus = async () => {
  const [menus, aliases] = await Promise.all([
    requestLineApi("/v2/bot/richmenu/list"),
    requestLineApi("/v2/bot/richmenu/alias/list")
  ]);

  console.log(
    JSON.stringify(
      {
        menus,
        aliases
      },
      null,
      2,
    ),
  );
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
    await applyAllRichMenus();
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
