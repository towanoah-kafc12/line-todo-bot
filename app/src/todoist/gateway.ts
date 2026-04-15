import { randomUUID } from "node:crypto";

import type { Task } from "@doist/todoist-sdk";

import type { TodoistClientLike } from "./client.js";

type SharedSection = {
  id: string;
  name: string;
};

type TodoistGatewayOptions = {
  client: TodoistClientLike;
  projectId: string;
  sections: SharedSection[];
  requestIdFactory?: () => string;
};

const isSharedTask = (task: Task, projectId: string, sectionIds: Set<string>): boolean =>
  task.projectId === projectId && task.sectionId !== null && sectionIds.has(task.sectionId);

export class TodoistGateway {
  private readonly client: TodoistClientLike;
  private readonly projectId: string;
  private readonly sections: SharedSection[];
  private readonly sectionIds: Set<string>;
  private readonly requestIdFactory: () => string;

  constructor({
    client,
    projectId,
    sections,
    requestIdFactory = randomUUID
  }: TodoistGatewayOptions) {
    this.client = client;
    this.projectId = projectId;
    this.sections = sections;
    this.sectionIds = new Set(sections.map((section) => section.id));
    this.requestIdFactory = requestIdFactory;
  }

  async listActiveTasks(): Promise<Task[]> {
    const response = await this.client.getTasks({
      projectId: this.projectId
    });

    return response.results
      .filter(
        (task) =>
          isSharedTask(task, this.projectId, this.sectionIds) &&
          !task.checked &&
          !task.isDeleted,
      )
      .sort((left, right) => {
        const leftSectionOrder = this.getSectionOrder(left.sectionId);
        const rightSectionOrder = this.getSectionOrder(right.sectionId);

        if (leftSectionOrder !== rightSectionOrder) {
          return leftSectionOrder - rightSectionOrder;
        }

        return left.childOrder - right.childOrder;
      });
  }

  async addTask(content: string, sectionId?: string): Promise<Task> {
    const targetSectionId = sectionId ?? this.sections[0]?.id;

    if (!targetSectionId || !this.sectionIds.has(targetSectionId)) {
      throw new Error("Task is outside the shared Todoist section");
    }

    const task = await this.client.addTask(
      {
        content,
        projectId: this.projectId,
        sectionId: targetSectionId
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
    if (!isSharedTask(task, this.projectId, this.sectionIds)) {
      throw new Error("Task is outside the shared Todoist section");
    }

    return task;
  }

  listSections(): SharedSection[] {
    return [...this.sections];
  }

  private getSectionOrder(sectionId: string | null): number {
    if (!sectionId) {
      return Number.MAX_SAFE_INTEGER;
    }

    const index = this.sections.findIndex((section) => section.id === sectionId);

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }
}
