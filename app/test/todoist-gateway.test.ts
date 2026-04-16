import { describe, expect, it, vi } from "vitest";

import { TodoistGateway } from "../src/todoist/gateway.js";

const createTask = (overrides: Partial<{
  id: string;
  projectId: string;
  sectionId: string | null;
  content: string;
  checked: boolean;
  isDeleted: boolean;
}> = {}) => ({
  id: overrides.id ?? "task-1",
  userId: "user-1",
  projectId: overrides.projectId ?? "project-1",
  sectionId: overrides.sectionId ?? "section-1",
  parentId: null,
  addedByUid: null,
  assignedByUid: null,
  responsibleUid: null,
  labels: [],
  deadline: null,
  duration: null,
  checked: overrides.checked ?? false,
  isDeleted: overrides.isDeleted ?? false,
  addedAt: null,
  completedAt: null,
  updatedAt: null,
  due: null,
  priority: 1,
  childOrder: 1,
  content: overrides.content ?? "牛乳を買う",
  description: "",
  dayOrder: -1,
  isCollapsed: false,
  isUncompletable: false,
  url: "https://todoist.com/showTask?id=task-1"
});

describe("TodoistGateway", () => {
  it("lists only active tasks in the configured shared sections", async () => {
    const client = {
      getTask: vi.fn(),
      getTasks: vi.fn().mockResolvedValue({
        results: [
          createTask({ id: "shared-active" }),
          createTask({ id: "shared-active-2", sectionId: "section-2" }),
          createTask({ id: "shared-completed", checked: true }),
          createTask({ id: "other-section", sectionId: "section-3" })
        ],
        nextCursor: null
      }),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      closeTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const gateway = new TodoistGateway({
      client,
      projectId: "project-1",
      sections: [
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ],
      requestIdFactory: () => "req-1"
    });

    await expect(gateway.listActiveTasks()).resolves.toMatchObject([
      { id: "shared-active", sectionName: "買うもの" },
      { id: "shared-active-2", sectionName: "やること" }
    ]);
    expect(client.getTasks).toHaveBeenCalledWith({
      projectId: "project-1"
    });
  });

  it("adds a task with fixed project and selected section ids", async () => {
    const client = {
      getTask: vi.fn(),
      getTasks: vi.fn(),
      addTask: vi.fn().mockResolvedValue(createTask({ id: "task-added", sectionId: "section-2" })),
      updateTask: vi.fn(),
      closeTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const gateway = new TodoistGateway({
      client,
      projectId: "project-1",
      sections: [
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ],
      requestIdFactory: () => "req-add"
    });

    await expect(gateway.addTask("洗剤を買う", "section-2")).resolves.toMatchObject({
      id: "task-added",
      content: "牛乳を買う",
      sectionName: "やること"
    });
    expect(client.addTask).toHaveBeenCalledWith(
      {
        content: "洗剤を買う",
        projectId: "project-1",
        sectionId: "section-2"
      },
      "req-add",
    );
  });

  it("rejects tasks outside the shared section", async () => {
    const client = {
      getTask: vi.fn(),
      getTasks: vi.fn(),
      addTask: vi.fn().mockResolvedValue(createTask({ sectionId: "section-2" })),
      updateTask: vi.fn(),
      closeTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const gateway = new TodoistGateway({
      client,
      projectId: "project-1",
      sections: [
        { id: "section-1", name: "買うもの" }
      ]
    });

    await expect(gateway.addTask("不正な task")).rejects.toThrow(
      /outside the shared Todoist section/,
    );
  });

  it("captures the task before completing or deleting it", async () => {
    const task = createTask({ id: "task-1", content: "ゴミを出す" });
    const client = {
      getTask: vi.fn().mockResolvedValue(task),
      getTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      closeTask: vi.fn().mockResolvedValue(true),
      deleteTask: vi.fn().mockResolvedValue(true)
    };

    const gateway = new TodoistGateway({
      client,
      projectId: "project-1",
      sections: [
        { id: "section-1", name: "買うもの" }
      ],
      requestIdFactory: () => "req-write"
    });

    await expect(gateway.completeTask("task-1")).resolves.toMatchObject({
      content: "ゴミを出す",
      sectionName: "買うもの"
    });
    await expect(gateway.deleteTask("task-1")).resolves.toMatchObject({
      content: "ゴミを出す",
      sectionName: "買うもの"
    });
    expect(client.closeTask).toHaveBeenCalledWith("task-1", "req-write");
    expect(client.deleteTask).toHaveBeenCalledWith("task-1", "req-write");
  });

  it("exposes the configured section list", () => {
    const gateway = new TodoistGateway({
      client: {
        getTask: vi.fn(),
        getTasks: vi.fn(),
        addTask: vi.fn(),
        updateTask: vi.fn(),
        closeTask: vi.fn(),
        deleteTask: vi.fn()
      },
      projectId: "project-1",
      sections: [
        { id: "section-1", name: "買うもの" },
        { id: "section-2", name: "やること" }
      ]
    });

    expect(gateway.listSections()).toEqual([
      { id: "section-1", name: "買うもの" },
      { id: "section-2", name: "やること" }
    ]);
  });
});
