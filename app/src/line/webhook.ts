import { validateSignature, type webhook } from "@line/bot-sdk";

import { isAuthorizedUserId } from "./authorization.js";

type AuthorizedTextEvent = {
  type: "text";
  text: string;
};

type AuthorizedPostbackEvent = {
  type: "postback";
  data: string;
};

type WebhookContext = {
  allowedUserIds: string[];
  channelSecret: string;
  handleAuthorizedEvent?: (input: {
    event: AuthorizedTextEvent | AuthorizedPostbackEvent;
    scopeKey: string;
    userId: string;
  }) => Promise<string | { ok: false; errorMessage: string } | null>;
  rawBody: string;
  signature: string | undefined;
};

export type EventEvaluation =
  | {
      status: "accepted";
      replyToken?: string;
      userId: string;
      replyMessage: string;
    }
  | {
      status: "rejected";
      reason: "unauthorized-user" | "unsupported-command";
      replyToken?: string;
      userId?: string;
      errorMessage: string;
    }
  | {
      status: "ignored";
      reason: "non-text-message" | "unsupported-event";
    };

type WebhookHandlingResult =
  | {
      ok: true;
      events: EventEvaluation[];
    }
  | {
      ok: false;
      statusCode: 400 | 401;
      errorMessage: string;
    };

type TextMessageEvent = webhook.MessageEvent & {
  message: webhook.TextMessageContent;
};

const isTextMessageEvent = (event: webhook.Event): event is TextMessageEvent =>
  "message" in event && event.type === "message" && event.message.type === "text";

const isPostbackEvent = (event: webhook.Event): event is webhook.PostbackEvent =>
  event.type === "postback";

const createScopeKey = (source: webhook.Source, userId: string): string => {
  switch (source.type) {
    case "user":
      return `user:${userId}`;
    case "group":
      return `group:${source.groupId}:user:${userId}`;
    case "room":
      return `room:${source.roomId}:user:${userId}`;
  }
};

const evaluateEvent = (
  {
    allowedUserIds,
    handleAuthorizedEvent
  }: Pick<WebhookContext, "allowedUserIds" | "handleAuthorizedEvent">,
  event: webhook.Event,
): Promise<EventEvaluation> => {
  if (!isTextMessageEvent(event) && !isPostbackEvent(event)) {
    if ("message" in event) {
      return Promise.resolve({
        status: "ignored",
        reason: "non-text-message"
      });
    }

    return Promise.resolve({
      status: "ignored",
      reason: "unsupported-event"
    });
  }

  const source = event.source;
  const userId = source?.userId;
  const replyToken = event.replyToken;

  if (!source || !userId || !isAuthorizedUserId(allowedUserIds, userId)) {
    return Promise.resolve({
      status: "rejected",
      reason: "unauthorized-user",
      replyToken,
      userId,
      errorMessage: "この操作は許可されていないよ"
    });
  }
  const scopeKey = createScopeKey(source, userId);

  return Promise.resolve(
    handleAuthorizedEvent?.({
      event: isTextMessageEvent(event)
        ? {
            type: "text",
            text: event.message.text
          }
        : {
            type: "postback",
            data: event.postback.data
          },
      scopeKey,
      userId
    }) ?? "accepted",
  ).then((result) => {
    if (result === null) {
      return {
        status: "ignored" as const,
        reason: "unsupported-event" as const
      };
    }

    if (typeof result !== "string" && result.ok === false) {
      return {
        status: "rejected" as const,
        reason: "unsupported-command" as const,
        replyToken,
        userId,
        errorMessage: result.errorMessage
      };
    }

    return {
      status: "accepted" as const,
      replyToken,
      userId,
      replyMessage: typeof result === "string" ? result : "accepted"
    };
  });
};

const parseCallbackRequest = (rawBody: string): webhook.CallbackRequest => {
  try {
    return JSON.parse(rawBody) as webhook.CallbackRequest;
  } catch {
    throw new Error("Webhook body must be valid JSON");
  }
};

export const handleWebhookRequest = async ({
  allowedUserIds,
  channelSecret,
  handleAuthorizedEvent,
  rawBody,
  signature
}: WebhookContext): Promise<WebhookHandlingResult> => {
  if (!signature) {
    return {
      ok: false,
      statusCode: 401,
      errorMessage: "Missing x-line-signature header"
    };
  }

  if (!validateSignature(rawBody, channelSecret, signature)) {
    return {
      ok: false,
      statusCode: 401,
      errorMessage: "Invalid LINE webhook signature"
    };
  }

  let callbackRequest: webhook.CallbackRequest;

  try {
    callbackRequest = parseCallbackRequest(rawBody);
  } catch (error) {
    return {
      ok: false,
      statusCode: 400,
      errorMessage: error instanceof Error ? error.message : "Webhook body is invalid"
    };
  }

  return {
    ok: true,
    events: await Promise.all(
      callbackRequest.events.map((event) =>
        evaluateEvent(
          {
            allowedUserIds,
            handleAuthorizedEvent
          },
          event,
        ),
      ),
    )
  };
};
