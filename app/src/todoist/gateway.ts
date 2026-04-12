import { randomUUID } from "node:crypto";

import type { Task } from "@doist/todoist-sdk";

import type { TodoistClientLike } from "./client.js";

type TodoistGatewayOptions = {
  client: TodoistClientLike;
  projectId: string;
  sectionId: string;
  requestIdFactory?: () => string;
};

const isSharedTask = (task: Task, projectId: string, sectionId: string): boolean =>
  task.projectId === projectId && task.sectionId === sectionId;

export class TodoistGateway {
  private readonly client: TodoistClientLike;
  private readonly projectId: string;
  private readonly sectionId: string;
  private readonly requestIdFactory: () => string;

  constructor({
    client,
    projectId,
    sectionId,
    requestIdFactory = randomUUID
  }: TodoistGatewayOptions) {
    this.client = client;
    this.projectId = projectId;
    this.sectionId = sectionId;
    this.requestIdFactory = requestIdFactory;
  }

  async listActiveTasks(): Promise<Task[]> {
    const response = await this.client.getTasks({
      projectId: this.projectId,
      sectionId: this.sectionId
    });

    return response.results.filter(
      (task) =>
        isSharedTask(task, this.projectId, this.sectionId) &&
        !task.checked &&
        !task.isDeleted,
    );
  }

  async addTask(content: string): Promise<Task> {
    const task = await this.client.addTask(
      {
        content,
        projectId: this.projectId,
        sectionId: this.sectionId
      },
      this.requestIdFactory(),
    );

    return this.assertSharedTask(task);
  }

  async updateTask(taskId: string, content: string): Promise<Task> {
    const task = await this.client.updateTask(
      taskId,
      {
        content
      },
      this.requestIdFactory(),
    );

    return this.assertSharedTask(task);
  }

  async completeTask(taskId: string): Promise<Task> {
    const task = this.assertSharedTask(await this.client.getTask(taskId));
    await this.client.closeTask(taskId, this.requestIdFactory());
    return task;
  }

  async deleteTask(taskId: string): Promise<Task> {
    const task = this.assertSharedTask(await this.client.getTask(taskId));
    await this.client.deleteTask(taskId, this.requestIdFactory());
    return task;
  }

  private assertSharedTask(task: Task): Task {
    if (!isSharedTask(task, this.projectId, this.sectionId)) {
      throw new Error("Task is outside the shared Todoist section");
    }

    return task;
  }
}
