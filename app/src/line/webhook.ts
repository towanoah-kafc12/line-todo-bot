import { validateSignature, type webhook } from "@line/bot-sdk";

import { parseCommand, type ParseResult } from "../commands/parser.js";
import { isAuthorizedUserId } from "./authorization.js";

type WebhookContext = {
  allowedUserIds: string[];
  channelSecret: string;
  handleAcceptedCommand?: (input: {
    command: ParseResult & { ok: true };
    userId: string;
  }) => Promise<string>;
  rawBody: string;
  signature: string | undefined;
};

export type EventEvaluation =
  | {
      status: "accepted";
      replyToken?: string;
      userId: string;
      command: ParseResult & { ok: true };
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

const evaluateEvent = (
  {
    allowedUserIds,
    handleAcceptedCommand
  }: Pick<WebhookContext, "allowedUserIds" | "handleAcceptedCommand">,
  event: webhook.Event,
): Promise<EventEvaluation> => {
  if (!isTextMessageEvent(event)) {
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

  const userId = event.source?.userId;
  const replyToken = event.replyToken;

  if (!userId || !isAuthorizedUserId(allowedUserIds, userId)) {
    return Promise.resolve({
      status: "rejected",
      reason: "unauthorized-user",
      replyToken,
      userId,
      errorMessage: "この操作は許可されていないよ"
    });
  }

  const command = parseCommand(event.message.text);

  if (!command.ok) {
    return Promise.resolve({
      status: "rejected",
      reason: "unsupported-command",
      replyToken,
      userId,
      errorMessage: command.errorMessage
    });
  }

  return Promise.resolve(
    handleAcceptedCommand?.({
      command,
      userId
    }) ?? "accepted",
  ).then((replyMessage) => ({
    status: "accepted",
    replyToken,
    userId,
    command,
    replyMessage
  }));
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
  handleAcceptedCommand,
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
            handleAcceptedCommand
          },
          event,
        ),
      ),
    )
  };
};
