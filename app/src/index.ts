import "dotenv/config";

import { serve } from "@hono/node-server";

import { loadConfig } from "./config/env.js";
import { createApp } from "./server/create-app.js";

const config = loadConfig();
const app = createApp(config);

serve(
  {
    fetch: app.fetch,
    port: config.server.port
  },
  (info) => {
    console.log(`line-todo-bot listening on http://localhost:${info.port}`);
  }
);
