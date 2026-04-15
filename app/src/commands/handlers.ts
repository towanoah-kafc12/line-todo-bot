import type { ConversationState } from "../state/conversation-state.js";
import { parsePositiveIndex, type ParsedCommand } from "./parser.js";

export type SharedTask = {
  id: string;
  content: string;
  sectionId?: string | null;
  sectionName?: string;
};

export type SharedSection = {
  id: string;
  name: string;
};

export type SharedTodoGateway = {
  listActiveTasks(): Promise<SharedTask[]>;
  listSections(): SharedSection[];
  addTask(content: string, sectionId?: string): Promise<SharedTask>;
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
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  scopeKey: string;
};

type StartNumberedConversationOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
  prompt: string;
  state:
    | { type: "awaiting-edit-index" }
    | { type: "awaiting-complete-index" }
    | { type: "awaiting-delete-index" };
};

const formatTaskList = (tasks: SharedTask[]): string => {
  if (tasks.length === 0) {
    return "いまは共有 TODO は空だよ";
  }

  const lines: string[] = [];
  let currentSectionName: string | undefined;

  tasks.forEach((task, index) => {
    const sectionName = task.sectionName ?? "未分類";

    if (sectionName !== currentSectionName) {
      if (lines.length > 0) {
        lines.push("");
      }

      lines.push(`[${sectionName}]`);
      currentSectionName = sectionName;
    }

    lines.push(`${index + 1}. ${task.content}`);
  });

  return lines.join("\n");
};

const formatSectionChoices = (sections: SharedSection[]): string =>
  sections.map((section, index) => `${index + 1}. ${section.name}`).join("\n");

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
}: StartEditConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    prompt: "編集したい番号を送って",
    state: {
      type: "awaiting-edit-index"
    }
  });

export const startCompleteConversation = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey
}: StartEditConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    prompt: "完了したい番号を送って",
    state: {
      type: "awaiting-complete-index"
    }
  });

export const startDeleteConversation = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey
}: StartEditConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    prompt: "削除したい番号を送って",
    state: {
      type: "awaiting-delete-index"
    }
  });

const startNumberedConversation = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  prompt,
  state
}: StartNumberedConversationOptions): Promise<string> => {
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
    ...state
  });

  return `${formatTaskList(tasks)}\n\n${prompt}`;
};

export const startAddConversation = async ({
  gateway,
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  const sections = gateway.listSections();

  if (sections.length === 1) {
    conversationStateStore.save(scopeKey, {
      type: "awaiting-add-content",
      sectionId: sections[0].id
    });

    return `${sections[0].name} に追加したいタスク名を送って`;
  }

  conversationStateStore.save(scopeKey, {
    type: "awaiting-add-section"
  });

  return `どのセクションに追加する？\n${formatSectionChoices(sections)}`;
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
    case "awaiting-add-section": {
      const sections = gateway.listSections();
      const sectionByIndex = parsePositiveIndex(trimmed);
      const selectedSection =
        (sectionByIndex !== null ? sections[sectionByIndex - 1] : null) ??
        sections.find((section) => section.name === trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(sections)}`;
      }

      conversationStateStore.save(scopeKey, {
        type: "awaiting-add-content",
        sectionId: selectedSection.id
      });
      return `${selectedSection.name} に追加したいタスク名を送って`;
    }

    case "awaiting-add-content": {
      if (trimmed.length === 0) {
        return "追加する内容が空だよ";
      }

      const task = await gateway.addTask(trimmed, state.sectionId);
      conversationStateStore.clear(scopeKey);
      const sectionLabel = task.sectionName ? ` [${task.sectionName}]` : "";
      return `追加したよ${sectionLabel}: ${task.content}`;
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

    case "awaiting-complete-index": {
      const index = parsePositiveIndex(trimmed);

      if (index === null) {
        return "番号を送ってね";
      }

      const taskId = resolveTaskId(listStateStore, scopeKey, index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.completeTask(taskId);
      conversationStateStore.clear(scopeKey);
      listStateStore.clear(scopeKey);
      return `完了したよ: ${task.content}`;
    }

    case "awaiting-delete-index": {
      const index = parsePositiveIndex(trimmed);

      if (index === null) {
        return "番号を送ってね";
      }

      const taskId = resolveTaskId(listStateStore, scopeKey, index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.deleteTask(taskId);
      conversationStateStore.clear(scopeKey);
      listStateStore.clear(scopeKey);
      return `削除したよ: ${task.content}`;
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
      const sections = gateway.listSections();

      if (sections.length > 1) {
        return "追加ボタンからセクションを選んでね";
      }

      const task = await gateway.addTask(command.content, sections[0]?.id);
      const sectionLabel = task.sectionName ? ` [${task.sectionName}]` : "";
      return `追加したよ${sectionLabel}: ${task.content}`;
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
