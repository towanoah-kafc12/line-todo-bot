import { Hono } from "hono";

import type { AppConfig } from "../config/env.js";
import {
  continueAddConversationWithSection,
  continueCompleteConversationWithSection,
  continueDeleteConversationWithSection,
  continueEditConversationWithSection,
  handleCommand,
  handleConversationText,
  showTaskList,
  showTaskListBySection,
  startListConversation,
  startAddConversation,
  startCompleteConversation,
  startDeleteConversation,
  startEditConversation,
  type ConversationStateStoreLike,
  type ListStateStoreLike,
  type SharedTodoGateway
} from "../commands/handlers.js";
import { parseCommand } from "../commands/parser.js";
import {
  createConversationRichMenuManager,
  type ConversationRichMenuManagerLike
} from "../line/conversation-rich-menu.js";
import { buildTextReplyMessage, createMessagingClient, type MessagingClientLike } from "../line/reply.js";
import { handleWebhookRequest, type EventEvaluation } from "../line/webhook.js";
import { InMemoryConversationStateStore } from "../state/conversation-state.js";
import { InMemoryListStateStore } from "../state/list-state.js";
import { createTodoistClient } from "../todoist/client.js";
import { TodoistGateway } from "../todoist/gateway.js";

type CreateAppDependencies = {
  conversationStateStore?: ConversationStateStoreLike;
  listStateStore?: ListStateStoreLike;
  messagingClient?: MessagingClientLike;
  conversationRichMenuManager?: ConversationRichMenuManagerLike;
  todoistGateway?: SharedTodoGateway;
};

type ReplyableEvent = Extract<EventEvaluation, { status: "accepted" | "rejected" }> & {
  replyToken: string;
};

type MenuPostback =
  | { kind: "menu"; menu: "list" | "add" | "edit" | "complete" | "delete" | "list-preview" | "list-all" }
  | { kind: "section"; menu: "list" | "add" | "edit" | "complete" | "delete"; sectionId: string }
  | null;

const parseMenuPostback = (data: string): MenuPostback => {
  if (data === "menu=list") {
    return { kind: "menu", menu: "list" };
  }

  if (data === "menu=add") {
    return { kind: "menu", menu: "add" };
  }

  if (data === "menu=edit") {
    return { kind: "menu", menu: "edit" };
  }

  if (data === "menu=complete") {
    return { kind: "menu", menu: "complete" };
  }

  if (data === "menu=delete") {
    return { kind: "menu", menu: "delete" };
  }

  if (data === "menu=list-preview") {
    return { kind: "menu", menu: "list-preview" };
  }

  if (data === "menu=list:all") {
    return { kind: "menu", menu: "list-all" };
  }

  const sectionMatch = data.match(/^menu=(list|add|edit|complete|delete):section:(.+)$/);

  if (!sectionMatch) {
    return null;
  }

  return {
    kind: "section",
    menu: sectionMatch[1] as "list" | "add" | "edit" | "complete" | "delete",
    sectionId: sectionMatch[2]
  };
};

export const createApp = (config: AppConfig, dependencies: CreateAppDependencies = {}): Hono => {
  const app = new Hono();
  const todoistGateway =
    dependencies.todoistGateway ??
    new TodoistGateway({
      client: createTodoistClient(config),
      projectId: config.todoist.projectId,
      sections: config.todoist.sections
    });
  const listStateStore =
    dependencies.listStateStore ??
    new InMemoryListStateStore({
      ttlSeconds: config.server.listStateTtlSeconds
    });
  const conversationStateStore =
    dependencies.conversationStateStore ??
    new InMemoryConversationStateStore({
      ttlSeconds: config.server.listStateTtlSeconds
    });
  const messagingClient = dependencies.messagingClient ?? createMessagingClient(config);
  const conversationRichMenuManager =
    dependencies.conversationRichMenuManager ??
    createConversationRichMenuManager(messagingClient);

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
      handleAuthorizedEvent: async ({ event, scopeKey, userId }) => {
        let replyMessage: string | { ok: false; errorMessage: string } | null;

        if (event.type === "postback") {
          const parsedPostback = parseMenuPostback(event.data);

          if (parsedPostback?.kind === "menu" && parsedPostback.menu === "list") {
            replyMessage = await startListConversation({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "add") {
            replyMessage = await startAddConversation({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "complete") {
            replyMessage = await startCompleteConversation({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "delete") {
            replyMessage = await startDeleteConversation({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "edit") {
            replyMessage = await startEditConversation({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "list-preview") {
            const stateForPreview = conversationStateStore.load(scopeKey);

            replyMessage = await showTaskList({
              gateway: todoistGateway,
              listStateStore,
              scopeKey,
              sectionId:
                stateForPreview && "sectionId" in stateForPreview
                  ? stateForPreview.sectionId
                  : undefined
            });
          } else if (parsedPostback?.kind === "menu" && parsedPostback.menu === "list-all") {
            conversationStateStore.clear(scopeKey);
            replyMessage = await showTaskList({
              gateway: todoistGateway,
              listStateStore,
              scopeKey
            });
          } else if (parsedPostback?.kind === "section" && parsedPostback.menu === "list") {
            replyMessage = await showTaskListBySection({
              gateway: todoistGateway,
              conversationStateStore,
              listStateStore,
              scopeKey,
              sectionId: parsedPostback.sectionId
            });
          } else if (parsedPostback?.kind === "section" && parsedPostback.menu === "add") {
            replyMessage = await continueAddConversationWithSection({
              gateway: todoistGateway,
              conversationStateStore,
              scopeKey,
              sectionId: parsedPostback.sectionId
            });
          } else if (parsedPostback?.kind === "section" && parsedPostback.menu === "edit") {
            replyMessage = await continueEditConversationWithSection({
              gateway: todoistGateway,
              conversationStateStore,
              listStateStore,
              scopeKey,
              sectionId: parsedPostback.sectionId
            });
          } else if (parsedPostback?.kind === "section" && parsedPostback.menu === "complete") {
            replyMessage = await continueCompleteConversationWithSection({
              gateway: todoistGateway,
              conversationStateStore,
              listStateStore,
              scopeKey,
              sectionId: parsedPostback.sectionId
            });
          } else if (parsedPostback?.kind === "section" && parsedPostback.menu === "delete") {
            replyMessage = await continueDeleteConversationWithSection({
              gateway: todoistGateway,
              conversationStateStore,
              listStateStore,
              scopeKey,
              sectionId: parsedPostback.sectionId
            });
          } else {
            replyMessage = null;
          }
        } else {
          const conversationalReply = await handleConversationText({
            gateway: todoistGateway,
            conversationStateStore,
            listStateStore,
            scopeKey,
            text: event.text
          });

          if (conversationalReply) {
            replyMessage = conversationalReply;
          } else {
            const command = parseCommand(event.text);

            if (!command.ok) {
              replyMessage = {
                ok: false as const,
                errorMessage: command.errorMessage
              };
            } else {
              replyMessage = await handleCommand({
                command: command.command,
                gateway: todoistGateway,
                listStateStore,
                scopeKey
              });
            }
          }
        }

        await conversationRichMenuManager.sync(
          userId,
          conversationStateStore.load(scopeKey),
        );

        return replyMessage;
      },
      rawBody,
      signature: context.req.header("x-line-signature")
    });

    if (!result.ok) {
      console.warn("[webhook] rejected request", {
        statusCode: result.statusCode,
        errorMessage: result.errorMessage
      });
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

    console.log("[webhook] processed events", {
      acceptedEvents: result.events.filter((event) => event.status === "accepted").length,
      rejectedEvents: result.events.filter((event) => event.status === "rejected").length,
      ignoredEvents: result.events.filter((event) => event.status === "ignored").length,
      replyableEvents: replyableEvents.length,
      eventSummaries: result.events.map((event) => ({
        status: event.status,
        reason: "reason" in event ? event.reason : undefined,
        userId: "userId" in event ? (event.userId ?? null) : null
      }))
    });

    try {
      await Promise.all(
        replyableEvents.map((event) =>
          messagingClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              buildTextReplyMessage(
                event.status === "accepted" ? event.replyMessage : event.errorMessage,
              )
            ]
          }),
        ),
      );
    } catch (error) {
      console.error("[webhook] failed to send LINE reply", error);
      return context.json(
        {
          ok: false,
          errorMessage: "Failed to send LINE reply"
        },
        502,
      );
    }

    return context.json({
      ok: true,
      acceptedEvents: result.events.filter((event) => event.status === "accepted").length,
      repliedEvents: replyableEvents.length,
      events: result.events
    });
  });

  return app;
};
