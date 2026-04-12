import { Hono } from "hono";

import type { AppConfig } from "../config/env.js";
import { handleCommand, type ListStateStoreLike, type SharedTodoGateway } from "../commands/handlers.js";
import { buildTextReplyMessage, createMessagingClient, type MessagingClientLike } from "../line/reply.js";
import { handleWebhookRequest, type EventEvaluation } from "../line/webhook.js";
import { InMemoryListStateStore } from "../state/list-state.js";
import { createTodoistClient } from "../todoist/client.js";
import { TodoistGateway } from "../todoist/gateway.js";

type CreateAppDependencies = {
  listStateStore?: ListStateStoreLike;
  messagingClient?: MessagingClientLike;
  todoistGateway?: SharedTodoGateway;
};

type ReplyableEvent = Extract<EventEvaluation, { status: "accepted" | "rejected" }> & {
  replyToken: string;
};

export const createApp = (config: AppConfig, dependencies: CreateAppDependencies = {}): Hono => {
  const app = new Hono();
  const todoistGateway =
    dependencies.todoistGateway ??
    new TodoistGateway({
      client: createTodoistClient(config),
      projectId: config.todoist.projectId,
      sectionId: config.todoist.sectionId
    });
  const listStateStore =
    dependencies.listStateStore ??
    new InMemoryListStateStore({
      ttlSeconds: config.server.listStateTtlSeconds
    });
  const messagingClient = dependencies.messagingClient ?? createMessagingClient(config);

  app.get("/", (context) =>
    context.json({
      name: "line-todo-bot",
      status: "bootstrap-ready",
      allowedUserCount: config.line.allowedUserIds.length
    })
  );

  app.get("/health", (context) =>
    context.json({
      status: "ok"
    })
  );

  app.post("/webhook", async (context) => {
    const rawBody = await context.req.text();
    const result = await handleWebhookRequest({
      allowedUserIds: config.line.allowedUserIds,
      channelSecret: config.line.channelSecret,
      handleAcceptedCommand: ({ command, userId }) =>
        handleCommand({
          command: command.command,
          gateway: todoistGateway,
          listStateStore,
          userId
        }),
      rawBody,
      signature: context.req.header("x-line-signature")
    });

    if (!result.ok) {
      return context.json(
        {
          ok: false,
          errorMessage: result.errorMessage
        },
        result.statusCode,
      );
    }

    const replyableEvents = result.events.filter(
      (event): event is ReplyableEvent =>
        "replyToken" in event &&
        typeof event.replyToken === "string" &&
        (event.status === "accepted" || event.status === "rejected"),
    );

    await Promise.all(
      replyableEvents.map((event) =>
        messagingClient.replyMessage({
          replyToken: event.replyToken!,
          messages: [
            buildTextReplyMessage(
              event.status === "accepted" ? event.replyMessage : event.errorMessage,
            )
          ]
        }),
      ),
    );

    return context.json({
      ok: true,
      acceptedEvents: result.events.filter((event) => event.status === "accepted").length,
      repliedEvents: replyableEvents.length,
      events: result.events
    });
  });

  return app;
};
