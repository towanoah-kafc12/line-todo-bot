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
  listActiveTasks(sectionId?: string): Promise<SharedTask[]>;
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

type StartAddConversationOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  scopeKey: string;
};

type ContinueSectionConversationOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
  sectionId: string;
};

type StartNumberedConversationOptions = {
  gateway: SharedTodoGateway;
  conversationStateStore: ConversationStateStoreLike;
  listStateStore: ListStateStoreLike;
  scopeKey: string;
  sectionId: string;
  prompt: string;
  state:
    | { type: "awaiting-edit-index"; sectionId: string }
    | { type: "awaiting-complete-index"; sectionId: string }
    | { type: "awaiting-delete-index"; sectionId: string };
};

const editDeleteCommands = new Set(["削除", "削除する"]);

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

const findSectionById = (sections: SharedSection[], sectionId: string): SharedSection | null =>
  sections.find((section) => section.id === sectionId) ?? null;

const findSectionFromInput = (
  sections: SharedSection[],
  input: string,
): SharedSection | null => {
  const sectionByIndex = parsePositiveIndex(input);

  return (
    (sectionByIndex !== null ? sections[sectionByIndex - 1] : null) ??
    sections.find((section) => section.name === input) ??
    null
  );
};

const resolveTaskId = (
  listStateStore: ListStateStoreLike,
  scopeKey: string,
  index: number,
): string | null => listStateStore.resolve(scopeKey, index);

export const showTaskList = async ({
  gateway,
  listStateStore,
  scopeKey,
  sectionId
}: Pick<HandleCommandOptions, "gateway" | "listStateStore" | "scopeKey"> & {
  sectionId?: string;
}): Promise<string> => {
  const tasks = await gateway.listActiveTasks(sectionId);
  listStateStore.save(
    scopeKey,
    tasks.map((task) => task.id),
  );
  return formatTaskList(tasks);
};

export const startListConversation = async ({
  gateway,
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  conversationStateStore.save(scopeKey, {
    type: "awaiting-list-section"
  });

  return `どのセクションを表示する？\n${formatSectionChoices(gateway.listSections())}`;
};

export const startEditConversation = async ({
  gateway,
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  conversationStateStore.save(scopeKey, {
    type: "awaiting-edit-section"
  });

  return `どのセクションを編集する？\n${formatSectionChoices(gateway.listSections())}`;
};

export const startCompleteConversation = async ({
  gateway,
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  conversationStateStore.save(scopeKey, {
    type: "awaiting-complete-section"
  });

  return `どのセクションを完了する？\n${formatSectionChoices(gateway.listSections())}`;
};

export const startDeleteConversation = async ({
  gateway,
  conversationStateStore,
  scopeKey
}: StartAddConversationOptions): Promise<string> => {
  conversationStateStore.save(scopeKey, {
    type: "awaiting-delete-section"
  });

  return `どのセクションを削除する？\n${formatSectionChoices(gateway.listSections())}`;
};

export const showTaskListBySection = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  sectionId
}: ContinueSectionConversationOptions): Promise<string> => {
  conversationStateStore.clear(scopeKey);
  return showTaskList({
    gateway,
    listStateStore,
    scopeKey,
    sectionId
  });
};

export const continueAddConversationWithSection = async ({
  gateway,
  conversationStateStore,
  sectionId,
  scopeKey
}: Omit<ContinueSectionConversationOptions, "listStateStore">): Promise<string> => {
  const section = findSectionById(gateway.listSections(), sectionId);

  if (!section) {
    conversationStateStore.clear(scopeKey);
    return "セクションが見つからないよ";
  }

  conversationStateStore.save(scopeKey, {
    type: "awaiting-add-content",
    sectionId: section.id
  });

  return `${section.name} に追加したいタスク名を送って`;
};

export const continueEditConversationWithSection = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  sectionId
}: ContinueSectionConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    sectionId,
    prompt: "編集したい番号を送って",
    state: {
      type: "awaiting-edit-index",
      sectionId
    }
  });

export const continueCompleteConversationWithSection = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  sectionId
}: ContinueSectionConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    sectionId,
    prompt: "完了したい番号を送って",
    state: {
      type: "awaiting-complete-index",
      sectionId
    }
  });

export const continueDeleteConversationWithSection = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  sectionId
}: ContinueSectionConversationOptions): Promise<string> =>
  startNumberedConversation({
    gateway,
    conversationStateStore,
    listStateStore,
    scopeKey,
    sectionId,
    prompt: "削除したい番号を送って",
    state: {
      type: "awaiting-delete-index",
      sectionId
    }
  });

const startNumberedConversation = async ({
  gateway,
  conversationStateStore,
  listStateStore,
  scopeKey,
  sectionId,
  prompt,
  state
}: StartNumberedConversationOptions): Promise<string> => {
  const tasks = await gateway.listActiveTasks(sectionId);
  const section = findSectionById(gateway.listSections(), sectionId);
  const sectionName = section?.name ?? "このセクション";

  if (tasks.length === 0) {
    conversationStateStore.clear(scopeKey);
    return `${sectionName} の共有 TODO は空だよ`;
  }

  listStateStore.save(
    scopeKey,
    tasks.map((task) => task.id),
  );
  conversationStateStore.save(scopeKey, {
    ...state
  });

  return `${formatTaskList(tasks)}\n\n${sectionName} で${prompt}`;
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
      const selectedSection = findSectionFromInput(sections, trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(sections)}`;
      }

      return continueAddConversationWithSection({
        gateway,
        conversationStateStore,
        scopeKey,
        sectionId: selectedSection.id
      });
    }

    case "awaiting-list-section": {
      const sections = gateway.listSections();
      const selectedSection = findSectionFromInput(sections, trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(sections)}`;
      }

      return showTaskListBySection({
        gateway,
        conversationStateStore,
        listStateStore,
        scopeKey,
        sectionId: selectedSection.id
      });
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

    case "awaiting-edit-section": {
      const selectedSection = findSectionFromInput(gateway.listSections(), trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(gateway.listSections())}`;
      }

      return continueEditConversationWithSection({
        gateway,
        conversationStateStore,
        listStateStore,
        scopeKey,
        sectionId: selectedSection.id
      });
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
        taskId,
        sectionId: state.sectionId
      });
      return "新しい内容を送って\n削除したいなら「削除」って送って";
    }

    case "awaiting-complete-section": {
      const selectedSection = findSectionFromInput(gateway.listSections(), trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(gateway.listSections())}`;
      }

      return continueCompleteConversationWithSection({
        gateway,
        conversationStateStore,
        listStateStore,
        scopeKey,
        sectionId: selectedSection.id
      });
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

    case "awaiting-delete-section": {
      const selectedSection = findSectionFromInput(gateway.listSections(), trimmed);

      if (!selectedSection) {
        return `番号かセクション名を送ってね\n${formatSectionChoices(gateway.listSections())}`;
      }

      return continueDeleteConversationWithSection({
        gateway,
        conversationStateStore,
        listStateStore,
        scopeKey,
        sectionId: selectedSection.id
      });
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
      if (editDeleteCommands.has(trimmed)) {
        const task = await gateway.deleteTask(state.taskId);
        conversationStateStore.clear(scopeKey);
        listStateStore.clear(scopeKey);
        return `削除したよ: ${task.content}`;
      }

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
      return showTaskList({
        gateway,
        listStateStore,
        scopeKey
      });
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
