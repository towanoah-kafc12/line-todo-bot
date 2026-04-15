import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const lineAssetDir = path.resolve(process.cwd(), "assets", "line");

const loadDefinition = (fileName: string) =>
  JSON.parse(readFileSync(path.join(lineAssetDir, fileName), "utf8"));

describe("rich menu definitions", () => {
  it("keeps the default main menu actions", () => {
    expect(loadDefinition("default-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      name: "default-main-menu",
      chatBarText: "TODO メニュー",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 834,
            height: 720
          },
          action: {
            type: "message",
            label: "一覧を見る",
            text: "みる"
          }
        },
        {
          bounds: {
            x: 834,
            y: 0,
            width: 833,
            height: 720
          },
          action: {
            type: "postback",
            label: "追加する",
            data: "menu=add",
            displayText: "タスクを追加する"
          }
        },
        {
          bounds: {
            x: 1667,
            y: 0,
            width: 833,
            height: 720
          },
          action: {
            type: "postback",
            label: "完了する",
            data: "menu=complete",
            displayText: "タスクを完了する"
          }
        },
        {
          bounds: {
            x: 1860,
            y: 720,
            width: 480,
            height: 483
          },
          action: {
            type: "postback",
            label: "編集する",
            data: "menu=edit",
            displayText: "タスクを編集する"
          }
        },
        {
          bounds: {
            x: 1860,
            y: 1203,
            width: 480,
            height: 483
          },
          action: {
            type: "postback",
            label: "削除する",
            data: "menu=delete",
            displayText: "タスクを削除する"
          }
        }
      ]
    });
  });

  it("defines state menus with cancel and list-preview actions", () => {
    const expectedAreas = [
      {
        bounds: {
          x: 0,
          y: 1080,
          width: 1250,
          height: 606
        },
        action: {
          type: "message",
          label: "キャンセル",
          text: "キャンセル"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 1080,
          width: 1250,
          height: 606
        },
        action: {
          type: "postback",
          label: "一覧を見る",
          data: "menu=list-preview",
          displayText: "一覧を見直す"
        }
      }
    ];

    expect(loadDefinition("add-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "state-add-menu",
      chatBarText: "追加中",
      areas: expectedAreas
    });
    expect(loadDefinition("edit-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "state-edit-menu",
      chatBarText: "編集中",
      areas: expectedAreas
    });
    expect(loadDefinition("complete-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "state-complete-menu",
      chatBarText: "完了中",
      areas: expectedAreas
    });
    expect(loadDefinition("delete-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "state-delete-menu",
      chatBarText: "削除中",
      areas: expectedAreas
    });
  });
});
