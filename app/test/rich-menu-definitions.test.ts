import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { hydrateRichMenuDefinition, loadConfiguredSections } from "../../scripts/rich-menu-definitions.mjs";

const lineAssetDir = path.resolve(process.cwd(), "assets", "line");

const loadDefinition = (fileName: string) =>
  JSON.parse(readFileSync(path.join(lineAssetDir, fileName), "utf8"));

describe("rich menu definition hydration", () => {
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
          inputOption: "openKeyboard"
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
          inputOption: "openKeyboard"
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
