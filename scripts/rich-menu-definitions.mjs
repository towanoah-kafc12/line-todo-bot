/* global process */

const splitCsv = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const sectionBounds = [
  {
    x: 0,
    y: 0,
    width: 1250,
    height: 843
  },
  {
    x: 1250,
    y: 0,
    width: 1250,
    height: 843
  }
];

const menuDisplayText = {
  list: (sectionName) => `${sectionName}を表示する`,
  add: (sectionName) => `${sectionName}に追加する`,
  edit: (sectionName) => `${sectionName}を編集する`,
  complete: (sectionName) => `${sectionName}を完了する`,
  delete: (sectionName) => `${sectionName}を削除する`
};

const buildSectionAction = (menuKey, section) => {
  const action = {
    type: "postback",
    label: section.name,
    data: `menu=${menuKey}:section:${section.id}`,
    displayText: menuDisplayText[menuKey](section.name)
  };

  if (menuKey === "add") {
    action.inputOption = "openKeyboard";
  }

  return action;
};

const cloneDefinition = (definition) => JSON.parse(JSON.stringify(definition));

export const loadConfiguredSections = (env = process.env) => {
  const sectionIds = splitCsv(env.TODOIST_SECTION_IDS ?? "");
  const sectionNames = splitCsv(env.TODOIST_SECTION_NAMES ?? "");

  if (sectionIds.length === 0 || sectionNames.length === 0) {
    return [];
  }

  if (sectionIds.length !== sectionNames.length) {
    throw new Error("TODOIST_SECTION_NAMES and TODOIST_SECTION_IDS must have the same number of entries");
  }

  if (sectionIds.length > 2) {
    throw new Error("The current rich menu layout supports up to 2 sections");
  }

  return sectionIds.map((id, index) => ({
    id,
    name: sectionNames[index]
  }));
};

export const hydrateRichMenuDefinition = ({
  definition,
  menuKey,
  sections
}) => {
  if (menuKey === "main") {
    return cloneDefinition(definition);
  }

  if (sections.length === 0) {
    return cloneDefinition(definition);
  }

  const nextDefinition = cloneDefinition(definition);

  if (!["list", "add", "edit", "complete", "delete"].includes(menuKey)) {
    return nextDefinition;
  }

  const sharedAreas = nextDefinition.areas.slice(2);
  const sectionAreas = sections.map((section, index) => ({
    bounds:
      sections.length === 1
        ? {
            x: 0,
            y: 0,
            width: 2500,
            height: 843
          }
        : sectionBounds[index],
    action: {
      ...buildSectionAction(menuKey, section)
    }
  }));

  nextDefinition.areas = [...sectionAreas, ...sharedAreas];
  return nextDefinition;
};
