import { messagingApi } from "@line/bot-sdk";

import type { AppConfig } from "../config/env.js";

export type MessagingClientLike = {
  replyMessage(request: messagingApi.ReplyMessageRequest): Promise<unknown>;
};

export const createMessagingClient = (config: AppConfig): messagingApi.MessagingApiClient =>
  new messagingApi.MessagingApiClient({
    channelAccessToken: config.line.channelAccessToken
  });

export const buildTextReplyMessage = (text: string): messagingApi.TextMessage => ({
  type: "text",
  text
});
