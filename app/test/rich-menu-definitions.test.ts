import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error Local script module is exercised directly in tests.
import { hydrateRichMenuDefinition, loadConfiguredSections } from "../../scripts/rich-menu-definitions.mjs";

const lineAssetDir = path.resolve(process.cwd(), "assets", "line");

const loadDefinition = (fileName: string) =>
  JSON.parse(readFileSync(path.join(lineAssetDir, fileName), "utf8"));

describe("rich menu definition hydration", () => {
  it("replaces the main menu buttons from env config", () => {
    const sections = loadConfiguredSections({
      TODOIST_SECTION_IDS: "section-buy,section-do",
      TODOIST_SECTION_NAMES: "買い物,用事"
    });

    const definition = hydrateRichMenuDefinition({
      definition: loadDefinition("default-rich-menu.json"),
      menuKey: "main",
      sections
    });

    expect(definition.areas).toEqual([
      {
        bounds: {
          x: 160,
          y: 460,
          width: 960,
          height: 220
        },
        action: {
          type: "postback",
          label: "買い物",
          data: "menu=list:section:section-buy",
          displayText: "買い物を表示する"
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
          label: "買い物",
          data: "menu=add:section:section-buy",
          displayText: "買い物に追加する",
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
          label: "買い物",
          data: "menu=edit:section:section-buy",
          displayText: "買い物を編集する"
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
          label: "買い物",
          data: "menu=complete:section:section-buy",
          displayText: "買い物を完了する"
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
          label: "用事",
          data: "menu=list:section:section-do",
          displayText: "用事を表示する"
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
          label: "用事",
          data: "menu=add:section:section-do",
          displayText: "用事に追加する",
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
          label: "用事",
          data: "menu=edit:section:section-do",
          displayText: "用事を編集する"
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
          label: "用事",
          data: "menu=complete:section:section-do",
          displayText: "用事を完了する"
        }
      }
    ]);
  });

  it("replaces section buttons from env config", () => {
    const sections = loadConfiguredSections({
      TODOIST_SECTION_IDS: "section-buy,section-do",
      TODOIST_SECTION_NAMES: "買い物,用事"
    });

    const definition = hydrateRichMenuDefinition({
      definition: loadDefinition("add-rich-menu.json"),
      menuKey: "add",
      sections
    });

    expect(definition.areas.slice(0, 2)).toEqual([
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "postback",
          label: "買い物",
          data: "menu=add:section:section-buy",
          displayText: "買い物に追加する",
          inputOption: "openKeyboard",
          fillInText: " "
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
          label: "用事",
          data: "menu=add:section:section-do",
          displayText: "用事に追加する",
          inputOption: "openKeyboard",
          fillInText: " "
        }
      }
    ]);
  });

  it("uses a single full-width area when only one section is configured", () => {
    const sections = loadConfiguredSections({
      TODOIST_SECTION_IDS: "section-only",
      TODOIST_SECTION_NAMES: "買い物"
    });

    const definition = hydrateRichMenuDefinition({
      definition: loadDefinition("list-rich-menu.json"),
      menuKey: "list",
      sections
    });

    expect(definition.areas[0]).toEqual({
      bounds: {
        x: 0,
        y: 0,
        width: 2500,
        height: 843
      },
      action: {
        type: "postback",
        label: "買い物",
        data: "menu=list:section:section-only",
        displayText: "買い物を表示する"
      }
    });
    expect(definition.areas).toHaveLength(3);
  });

  it("rejects more than two sections for the current layout", () => {
    expect(() =>
      loadConfiguredSections({
        TODOIST_SECTION_IDS: "section-1,section-2,section-3",
        TODOIST_SECTION_NAMES: "買い物,用事,掃除"
      })
    ).toThrow(/supports up to 2 sections/);
  });
});
