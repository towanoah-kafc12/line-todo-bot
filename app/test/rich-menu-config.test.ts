import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const richMenuDefinitionPath = path.resolve(
  process.cwd(),
  "assets",
  "line",
  "default-rich-menu.json",
);

describe("default rich menu definition", () => {
  it("uses message and postback actions that guide the main commands", () => {
    const definition = JSON.parse(readFileSync(richMenuDefinitionPath, "utf8"));

    expect(definition).toEqual({
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
});
