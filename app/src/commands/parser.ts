export type ParsedCommand =
  | { type: "list" }
  | { type: "add"; content: string }
  | { type: "complete"; index: number }
  | { type: "delete"; index: number }
  | { type: "edit"; index: number; content: string };

export type ParseResult =
  | { ok: true; command: ParsedCommand }
  | { ok: false; errorMessage: string };

export const parsePositiveIndex = (value: string): number | null => {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const index = Number(value);

  if (!Number.isInteger(index) || index <= 0) {
    return null;
  }

  return index;
};

export const parseCommand = (input: string): ParseResult => {
  const trimmed = input.trim();

  if (trimmed === "みる") {
    return { ok: true, command: { type: "list" } };
  }

  if (trimmed.startsWith("追加")) {
    const content = trimmed.slice("追加".length).trim();

    if (content.length === 0) {
      return { ok: false, errorMessage: "追加する内容が空だよ" };
    }

    return { ok: true, command: { type: "add", content } };
  }

  if (trimmed.startsWith("完了")) {
    const index = parsePositiveIndex(trimmed.slice("完了".length).trim());

    if (index === null) {
      return { ok: false, errorMessage: "番号が見つからないよ" };
    }

    return { ok: true, command: { type: "complete", index } };
  }

  if (trimmed.startsWith("削除")) {
    const index = parsePositiveIndex(trimmed.slice("削除".length).trim());

    if (index === null) {
      return { ok: false, errorMessage: "番号が見つからないよ" };
    }

    return { ok: true, command: { type: "delete", index } };
  }

  if (trimmed.startsWith("編集")) {
    const remainder = trimmed.slice("編集".length).trim();
    const [indexToken, ...contentTokens] = remainder.split(/\s+/);
    const index = parsePositiveIndex(indexToken ?? "");
    const content = contentTokens.join(" ").trim();

    if (index === null) {
      return { ok: false, errorMessage: "番号が見つからないよ" };
    }

    if (content.length === 0) {
      return { ok: false, errorMessage: "新しい内容が空だよ" };
    }

    return { ok: true, command: { type: "edit", index, content } };
  }

  return { ok: false, errorMessage: "使い方が違うよ" };
};
