import type { ParsedCommand } from "./parser.js";

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
  save(userId: string, taskIds: string[]): void;
  resolve(userId: string, index: number): string | null;
  clear(userId: string): void;
};

type HandleCommandOptions = {
  command: ParsedCommand;
  gateway: SharedTodoGateway;
  listStateStore: ListStateStoreLike;
  userId: string;
};

const formatTaskList = (tasks: SharedTask[]): string => {
  if (tasks.length === 0) {
    return "いまは共有 TODO は空だよ";
  }

  return tasks.map((task, index) => `${index + 1}. ${task.content}`).join("\n");
};

const resolveTaskId = (
  listStateStore: ListStateStoreLike,
  userId: string,
  index: number,
): string | null => listStateStore.resolve(userId, index);

export const handleCommand = async ({
  command,
  gateway,
  listStateStore,
  userId
}: HandleCommandOptions): Promise<string> => {
  switch (command.type) {
    case "list": {
      const tasks = await gateway.listActiveTasks();
      listStateStore.save(
        userId,
        tasks.map((task) => task.id),
      );
      return formatTaskList(tasks);
    }

    case "add": {
      const task = await gateway.addTask(command.content);
      return `追加したよ: ${task.content}`;
    }

    case "complete": {
      const taskId = resolveTaskId(listStateStore, userId, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.completeTask(taskId);
      listStateStore.clear(userId);
      return `完了したよ: ${task.content}`;
    }

    case "delete": {
      const taskId = resolveTaskId(listStateStore, userId, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.deleteTask(taskId);
      listStateStore.clear(userId);
      return `削除したよ: ${task.content}`;
    }

    case "edit": {
      const taskId = resolveTaskId(listStateStore, userId, command.index);

      if (!taskId) {
        return "番号が見つからないよ";
      }

      const task = await gateway.updateTask(taskId, command.content);
      return `更新したよ: ${task.content}`;
    }
  }
};
