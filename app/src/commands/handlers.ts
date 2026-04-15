import type { ConversationState } from "../state/conversation-state.js";
import { parsePositiveIndex, type ParsedCommand } from "./parser.js";

export type SharedTask = {
  id: string;
  content: string;
};

export type SharedTodoGateway = {
  listActiveTasks(): Promise<SharedTask[]>;
  addTask(content: string): Promise<SharedTask>;
  updateTask(taskId: string, content: string): Promise<SharedTask>;
  completeTask(taskId: string): Promise<SharedTask>;
  deleteTask(taskId: string): Promise<SharedTask>;
};

export type ListStateStoreLike = {
  save(scopeKey: string, taskIds: string[]): void;
  resolve(scopeKey: string, index: number): string | null;
  clear(scopeKey: string): void;
};

export type ConversationStateStoreLike = {
  save(scopeKey: string, state: ConversationState): void;
  load(scopeKey: string): ConversationState | null;
  clear(scopeKey: string): void;
};

type HandleCommandOptions = {
  command: ParsedCommand;
  gateway: SharedTodoGateway;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
};

type HandleConversationTextOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
  text: string;
};

type StartEditConversationOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
};

type StartAddConversationOptions = {
  conversationStateStore: ConversationStateStoreLike;
  scopeKey: string;
};

const formatTaskList = (tasks: SharedTask[]): string => {
  if (tasks.length === 0) {
    return "いまは共有 TODO は空だよ";
  }

  return tasks.map((task, index) => `${index + 1}. ${task.content}`).join("\n");
};

const resolveTaskId = (
  listStateStore: ListStateStoreLike,
  scopeKey: string,
  index: number,
): string | null => listStateStore.resolve(scopeKey, index);

export const startEditConversation = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey
}: StartEditConversationOptions): Promise<string> => {
  const tasks = await gateway.listActiveTasks();

  if (tasks.length === 0) {
    conversationStateStore.clear(scopeKey);
    return "いまは共有 TODO は空だよ";
  }

  listStateStore.save(
    scopeKey,
    tasks.map((task) => task.id),
  );
  conversationStateStore.save(scopeKey, {
    type: "awaiting-edit-index"
  });

  return `${formatTaskList(tasks)}\n\n編集したい番号を送って`;
};

export const startAddConversation = async ({
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  conversationStateStore.save(scopeKey, {
    type: "awaiting-add-content"
  });

  return "追加したいタスク名を送って";
};

export const handleConversationText = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  text
}: HandleConversationTextOptions): Promise<string | null> => {
  const state = conversationStateStore.load(scopeKey);

  if (!state) {
    return null;
  }

  const trimmed = text.trim();

  if (trimmed === "キャンセル" || trimmed === "やめる") {
    conversationStateStore.clear(scopeKey);
    return "操作をやめたよ";
  }

  switch (state.type) {
    case "awaiting-add-content": {
      if (trimmed.length === 0) {
        return "追加する内容が空だよ";
      }

      const task = await gateway.addTask(trimmed);
      conversationStateStore.clear(scopeKey);
      return `追加したよ: ${task.content}`;
    }

    case "awaiting-edit-index": {
      const index = parsePositiveIndex(trimmed);

      if (index === null) {
        return "番号を送ってね";
      }

      const taskId = resolveTaskId(listStateStore, scopeKey, index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      conversationStateStore.save(scopeKey, {
        type: "awaiting-edit-content",
        taskId
      });
      return "新しい内容を送って";
    }

    case "awaiting-edit-content": {
      if (trimmed.length === 0) {
        return "新しい内容が空だよ";
      }

      const task = await gateway.updateTask(state.taskId, trimmed);
      conversationStateStore.clear(scopeKey);
      return `更新したよ: ${task.content}`;
    }
  }
};

export const handleCommand = async ({
  command,
  gateway,
  listStateStore,
  scopeKey
}: HandleCommandOptions): Promise<string> => {
  switch (command.type) {
    case "list": {
      const tasks = await gateway.listActiveTasks();
      listStateStore.save(
        scopeKey,
        tasks.map((task) => task.id),
      );
      return formatTaskList(tasks);
    }

    case "add": {
      const task = await gateway.addTask(command.content);
      return `追加したよ: ${task.content}`;
    }

    case "complete": {
      const taskId = resolveTaskId(listStateStore, scopeKey, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.completeTask(taskId);
      listStateStore.clear(scopeKey);
      return `完了したよ: ${task.content}`;
    }

    case "delete": {
      const taskId = resolveTaskId(listStateStore, scopeKey, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.deleteTask(taskId);
      listStateStore.clear(scopeKey);
      return `削除したよ: ${task.content}`;
    }

    case "edit": {
      const taskId = resolveTaskId(listStateStore, scopeKey, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.updateTask(taskId, command.content);
      return `更新したよ: ${task.content}`;
    }
  }
};
