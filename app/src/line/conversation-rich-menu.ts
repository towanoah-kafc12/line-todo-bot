import type { ConversationState } from "../state/conversation-state.js";

export const conversationRichMenuAliases = {
  main: "todo-main",
  add: "todo-add",
  edit: "todo-edit",
  complete: "todo-complete",
  delete: "todo-delete"
} as const;

type RichMenuAliasId =
  (typeof conversationRichMenuAliases)[keyof typeof conversationRichMenuAliases];

type RichMenuAliasResponse = {
  richMenuId: string;
};

export type RichMenuMessagingClientLike = {
  getRichMenuAlias(richMenuAliasId: string): Promise<RichMenuAliasResponse>;
  linkRichMenuIdToUser(userId: string, richMenuId: string): Promise<unknown>;
  unlinkRichMenuIdFromUser(userId: string): Promise<unknown>;
};

export type ConversationRichMenuManagerLike = {
  sync(userId: string, state: ConversationState | null): Promise<void>;
};

const isRichMenuMessagingClientLike = (
  client: unknown,
): client is RichMenuMessagingClientLike => {
  if (!client || typeof client !== "object") {
    return false;
  }

  return (
    "getRichMenuAlias" in client &&
    typeof client.getRichMenuAlias === "function" &&
    "linkRichMenuIdToUser" in client &&
    typeof client.linkRichMenuIdToUser === "function" &&
    "unlinkRichMenuIdFromUser" in client &&
    typeof client.unlinkRichMenuIdFromUser === "function"
  );
};

const resolveAliasFromState = (state: ConversationState | null): RichMenuAliasId | null => {
  if (!state) {
    return null;
  }

  switch (state.type) {
    case "awaiting-add-section":
    case "awaiting-add-content":
      return conversationRichMenuAliases.add;
    case "awaiting-edit-index":
    case "awaiting-edit-content":
      return conversationRichMenuAliases.edit;
    case "awaiting-complete-index":
      return conversationRichMenuAliases.complete;
    case "awaiting-delete-index":
      return conversationRichMenuAliases.delete;
  }
};

const isNotLinkedRichMenuError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("404");
};

class NoopConversationRichMenuManager implements ConversationRichMenuManagerLike {
  async sync(): Promise<void> {
    return Promise.resolve();
  }
}

class ConversationRichMenuManager implements ConversationRichMenuManagerLike {
  private readonly aliasCache = new Map<RichMenuAliasId, string>();

  constructor(private readonly client: RichMenuMessagingClientLike) {}

  async sync(userId: string, state: ConversationState | null): Promise<void> {
    const alias = resolveAliasFromState(state);

    if (!alias) {
      try {
        await this.client.unlinkRichMenuIdFromUser(userId);
      } catch (error) {
        if (!isNotLinkedRichMenuError(error)) {
          throw error;
        }
      }

      return;
    }

    const richMenuId = await this.resolveRichMenuId(alias);
    await this.client.linkRichMenuIdToUser(userId, richMenuId);
  }

  private async resolveRichMenuId(alias: RichMenuAliasId): Promise<string> {
    const cached = this.aliasCache.get(alias);

    if (cached) {
      return cached;
    }

    const response = await this.client.getRichMenuAlias(alias);
    this.aliasCache.set(alias, response.richMenuId);
    return response.richMenuId;
  }
}

export const createConversationRichMenuManager = (
  client: unknown,
): ConversationRichMenuManagerLike => {
  if (!isRichMenuMessagingClientLike(client)) {
    return new NoopConversationRichMenuManager();
  }

  return new ConversationRichMenuManager(client);
};
