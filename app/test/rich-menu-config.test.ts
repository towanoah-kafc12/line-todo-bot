import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const lineAssetDir = path.resolve(process.cwd(), "assets", "line");

const loadDefinition = (fileName: string) =>
  JSON.parse(readFileSync(path.join(lineAssetDir, fileName), "utf8"));

describe("rich menu definitions", () => {
  it("uses the main menu for operation entrypoints", () => {
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
            x: 160,
            y: 460,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "買うもの 一覧を見る",
            data: "menu=list:section:2345678901",
            displayText: "買うものを表示する"
          }
        },
        {
          bounds: {
            x: 160,
            y: 720,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "買うもの 追加する",
            data: "menu=add:section:2345678901",
            displayText: "買うものに追加する",
            inputOption: "openKeyboard",
            fillInText: " "
          }
        },
        {
          bounds: {
            x: 160,
            y: 980,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "買うもの 編集する",
            data: "menu=edit:section:2345678901",
            displayText: "買うものを編集する"
          }
        },
        {
          bounds: {
            x: 160,
            y: 1240,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "買うもの 完了する",
            data: "menu=complete:section:2345678901",
            displayText: "買うものを完了する"
          }
        },
        {
          bounds: {
            x: 1380,
            y: 460,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "やること 一覧を見る",
            data: "menu=list:section:3456789012",
            displayText: "やることを表示する"
          }
        },
        {
          bounds: {
            x: 1380,
            y: 720,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "やること 追加する",
            data: "menu=add:section:3456789012",
            displayText: "やることに追加する",
            inputOption: "openKeyboard",
            fillInText: " "
          }
        },
        {
          bounds: {
            x: 1380,
            y: 980,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "やること 編集する",
            data: "menu=edit:section:3456789012",
            displayText: "やることを編集する"
          }
        },
        {
          bounds: {
            x: 1380,
            y: 1240,
            width: 960,
            height: 220
          },
          action: {
            type: "postback",
            label: "やること 完了する",
            data: "menu=complete:section:3456789012",
            displayText: "やることを完了する"
          }
        }
      ]
    });
  });

  it("defines a section menu for display", () => {
    expect(loadDefinition("list-rich-menu.json")).toEqual({
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      name: "state-list-menu",
      chatBarText: "表示中",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 1250,
            height: 843
          },
          action: {
            type: "postback",
            label: "買うもの",
            data: "menu=list:section:2345678901",
            displayText: "買うものを表示する"
          }
        },
        {
          bounds: {
            x: 1250,
            y: 0,
            width: 1250,
            height: 843
          },
          action: {
            type: "postback",
            label: "やること",
            data: "menu=list:section:3456789012",
            displayText: "やることを表示する"
          }
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 1250,
            height: 843
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
            y: 843,
            width: 1250,
            height: 843
          },
          action: {
            type: "postback",
            label: "全部見る",
            data: "menu=list:all",
            displayText: "全部表示する"
          }
        }
      ]
    });
  });

  it("defines section menus for add/edit/complete/delete", () => {
    const expectedSharedAreas = [
      {
        bounds: {
          x: 0,
          y: 843,
          width: 1250,
          height: 843
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
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: "postback",
          label: "一覧を見る",
          data: "menu=list-preview",
          displayText: "一覧を見直す"
        }
      }
    ];

    expect(loadDefinition("add-rich-menu.json")).toMatchObject({
      selected: true,
      name: "state-add-menu",
      chatBarText: "追加中",
      areas: [
        {
          action: {
            label: "買うもの",
            data: "menu=add:section:2345678901",
            inputOption: "openKeyboard",
            fillInText: " "
          }
        },
        {
          action: {
            label: "やること",
            data: "menu=add:section:3456789012",
            inputOption: "openKeyboard",
            fillInText: " "
          }
        },
        ...expectedSharedAreas
      ]
    });
    expect(loadDefinition("edit-rich-menu.json")).toMatchObject({
      selected: true,
      name: "state-edit-menu",
      chatBarText: "編集中",
      areas: [
        {
          action: {
            label: "買うもの",
            data: "menu=edit:section:2345678901"
          }
        },
        {
          action: {
            label: "やること",
            data: "menu=edit:section:3456789012"
          }
        },
        ...expectedSharedAreas
      ]
    });
    expect(loadDefinition("complete-rich-menu.json")).toMatchObject({
      selected: true,
      name: "state-complete-menu",
      chatBarText: "完了中",
      areas: [
        {
          action: {
            label: "買うもの",
            data: "menu=complete:section:2345678901"
          }
        },
        {
          action: {
            label: "やること",
            data: "menu=complete:section:3456789012"
          }
        },
        ...expectedSharedAreas
      ]
    });
    expect(loadDefinition("delete-rich-menu.json")).toMatchObject({
      selected: true,
      name: "state-delete-menu",
      chatBarText: "削除中",
      areas: [
        {
          action: {
            label: "買うもの",
            data: "menu=delete:section:2345678901"
          }
        },
        {
          action: {
            label: "やること",
            data: "menu=delete:section:3456789012"
          }
        },
        ...expectedSharedAreas
      ]
    });
  });
}
);
