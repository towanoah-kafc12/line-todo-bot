import { describe, expect, it } from "vitest";

import { parseCommand } from "../src/commands/parser.js";

describe("parseCommand", () => {
  it("parses the list command", () => {
    expect(parseCommand("みる")).toEqual({
      ok: true,
      command: {
        type: "list"
      }
    });
  });

  it("parses the add command", () => {
    expect(parseCommand("追加 牛乳を買う")).toEqual({
      ok: true,
      command: {
        type: "add",
        content: "牛乳を買う"
      }
    });
  });

  it("parses numbered commands", () => {
    expect(parseCommand("完了 2")).toEqual({
      ok: true,
      command: {
        type: "complete",
        index: 2
      }
    });

    expect(parseCommand("削除 3")).toEqual({
      ok: true,
      command: {
        type: "delete",
        index: 3
      }
    });

    expect(parseCommand("編集 4 洗剤を補充")).toEqual({
      ok: true,
      command: {
        type: "edit",
        index: 4,
        content: "洗剤を補充"
      }
    });
  });

  it("returns a clear error for invalid input", () => {
    expect(parseCommand("追加")).toEqual({
      ok: false,
      errorMessage: "追加する内容が空だよ"
    });

    expect(parseCommand("完了 x")).toEqual({
      ok: false,
      errorMessage: "番号が見つからないよ"
    });

    expect(parseCommand("編集 1")).toEqual({
      ok: false,
      errorMessage: "新しい内容が空だよ"
    });

    expect(parseCommand("よくわからない")).toEqual({
      ok: false,
      errorMessage: "使い方が違うよ"
    });
  });
});
