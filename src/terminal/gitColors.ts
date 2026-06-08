export type TokenKind = "git" | "subcommand" | "flag" | "string" | "plain";

const SUBCOMMAND_IDS = [
  "init",
  "status",
  "add",
  "commit",
  "branch",
  "checkout",
  "switch",
  "merge",
  "rebase",
  "stash",
  "log",
  "push",
  "pull",
  "fetch",
  "remote",
  "clone",
  "reset",
  "restore",
  "revert",
  "rm",
  "diff",
] as const;

export type SubcommandId = (typeof SUBCOMMAND_IDS)[number] | "default";

const SUBCOMMAND_SET = new Set<string>(SUBCOMMAND_IDS);

const ANSI: Record<TokenKind | SubcommandId, string> = {
  git: "\x1b[38;5;252m",
  subcommand: "\x1b[36m",
  flag: "\x1b[38;5;221m",
  string: "\x1b[38;5;208m",
  plain: "",
  default: "\x1b[38;5;245m",
  init: "\x1b[38;5;78m",
  status: "\x1b[38;5;117m",
  add: "\x1b[38;5;80m",
  commit: "\x1b[38;5;213m",
  branch: "\x1b[38;5;81m",
  checkout: "\x1b[38;5;81m",
  switch: "\x1b[38;5;81m",
  merge: "\x1b[38;5;147m",
  rebase: "\x1b[38;5;147m",
  stash: "\x1b[38;5;186m",
  log: "\x1b[38;5;109m",
  push: "\x1b[38;5;75m",
  pull: "\x1b[38;5;75m",
  fetch: "\x1b[38;5;75m",
  remote: "\x1b[38;5;75m",
  clone: "\x1b[38;5;75m",
  reset: "\x1b[38;5;203m",
  restore: "\x1b[38;5;203m",
  revert: "\x1b[38;5;203m",
  rm: "\x1b[38;5;203m",
  diff: "\x1b[38;5;109m",
};

const RESET = "\x1b[0m";

export function getSubcommandId(command: string): SubcommandId {
  const match = command.trim().match(/^git\s+(\S+)/i);
  if (!match) return "default";
  const sub = match[1].toLowerCase();
  return SUBCOMMAND_SET.has(sub) ? (sub as SubcommandId) : "default";
}

export function resolveShortcutColorId(command: string, shortcutId?: string): SubcommandId {
  if (shortcutId && shortcutId in ANSI) return shortcutId as SubcommandId;
  return getSubcommandId(command);
}

export function getAnsiColor(kind: TokenKind, subcommandId: SubcommandId = "default"): string {
  if (kind === "subcommand") return ANSI[subcommandId] ?? ANSI.default;
  return ANSI[kind];
}

export function getColorClass(kind: TokenKind, subcommandId: SubcommandId = "default"): string {
  if (kind === "git") return "git-token git-token--keyword";
  if (kind === "flag") return "git-token git-token--flag";
  if (kind === "string") return "git-token git-token--string";
  if (kind === "subcommand") return `git-token git-token--${subcommandId}`;
  return "git-token git-token--plain";
}

export function colorizeAnsi(text: string, kind: TokenKind, subcommandId: SubcommandId = "default"): string {
  const color = getAnsiColor(kind, subcommandId);
  if (!color) return text;
  return `${color}${text}${RESET}`;
}

export interface CommandToken {
  text: string;
  kind: TokenKind;
  subcommandId?: SubcommandId;
}

export function tokenizeGitCommand(command: string, _shortcutId?: string): CommandToken[] {
  const raw = command.trim();
  const parts = raw.match(/("[^"]*"|'[^']*'|\S+|\s+)/g) ?? [raw];
  const tokens: CommandToken[] = [];
  let seenGit = false;
  let seenSub = false;

  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, kind: "plain" });
      continue;
    }
    const lower = part.toLowerCase();
    if (!seenGit && lower === "git") {
      tokens.push({ text: part, kind: "git" });
      seenGit = true;
      continue;
    }
    if (seenGit && !seenSub && SUBCOMMAND_SET.has(lower)) {
      tokens.push({ text: part, kind: "subcommand", subcommandId: lower as SubcommandId });
      seenSub = true;
      continue;
    }
    if (/^-{1,2}[\w-]+$/.test(part)) {
      tokens.push({ text: part, kind: "flag" });
      continue;
    }
    if (/^["']/.test(part)) {
      tokens.push({ text: part, kind: "string" });
      continue;
    }
    tokens.push({ text: part, kind: "plain" });
  }

  return tokens;
}

export function highlightGitTokensAnsi(command: string, shortcutId?: string): string {
  const subcommandId = resolveShortcutColorId(command, shortcutId);
  return tokenizeGitCommand(command, shortcutId)
    .map((token) => {
      if (token.kind === "plain") return token.text;
      if (token.kind === "subcommand") return colorizeAnsi(token.text, "subcommand", token.subcommandId ?? subcommandId);
      return colorizeAnsi(token.text, token.kind, subcommandId);
    })
    .join("");
}
