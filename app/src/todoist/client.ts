import { TodoistApi, type AddTaskArgs, type GetTasksArgs, type Task, type UpdateTaskArgs } from "@doist/todoist-sdk";

import type { AppConfig } from "../config/env.js";

export type TodoistClientLike = {
  getTask(id: string): Promise<Task>;
  getTasks(args?: GetTasksArgs): Promise<{ results: Task[]; nextCursor: string | null }>;
  addTask(args: AddTaskArgs, requestId?: string): Promise<Task>;
  updateTask(id: string, args: UpdateTaskArgs, requestId?: string): Promise<Task>;
  closeTask(id: string, requestId?: string): Promise<boolean>;
  deleteTask(id: string, requestId?: string): Promise<boolean>;
};

export const createTodoistClient = (config: AppConfig): TodoistClientLike =>
  new TodoistApi(config.todoist.apiToken);
