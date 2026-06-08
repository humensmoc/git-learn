import { colorizeAnsi, getSubcommandId, highlightGitTokensAnsi, resolveShortcutColorId } from "./gitColors";

export type LineKind = "system" | "error" | "success" | "command" | "gitOutput" | "plain";

const SYSTEM_BANNER = /^----- .+ -----$/;
const ERROR_MARKERS = /错误|fatal:|不支持|未知命令/i;
const SUCCESS_MARKERS = /已执行|已重置/;
const COMMIT_LINE = /^\[.+\s+[0-9a-f]{4,}\]/i;
const FILE_CHANGED = /\d+ files? changed/i;
const STASH_REF = /stash@\{/;
const GIT_OUTPUT_HINT = /^(On branch |nothing to commit|Already up to date|Saved working|HEAD is now|To https?:)/i;

export function classifyLine(line: string): LineKind {
  const trimmed = line.trim();
  if (SYSTEM_BANNER.test(trimmed)) return "system";
  if (ERROR_MARKERS.test(line)) return "error";
  if (trimmed.startsWith("real>") || SUCCESS_MARKERS.test(line)) return "success";
  if (/^(\$ |: ).*\bgit\b/i.test(line) || /^\$ git /i.test(line)) return "command";
  if (COMMIT_LINE.test(trimmed) || FILE_CHANGED.test(line) || STASH_REF.test(line) || GIT_OUTPUT_HINT.test(trimmed)) {
    return "gitOutput";
  }
  if (/^\s*git\s+/i.test(trimmed)) return "command";
  return "plain";
}

function highlightGitOutput(line: string): string {
  const subcommandId = getSubcommandId("git log");
  let result = line;

  result = result.replace(/\[([^\]]+)\s+([0-9a-f]{4,})\]/gi, (_m, branch, hash) => {
    return `[${branch} ${colorizeAnsi(hash, "flag", subcommandId)}]`;
  });

  result = result.replace(/(\d+)(\s+files?\s+changed)/gi, (_m, num, tail) => {
    return `${colorizeAnsi(num, "flag", subcommandId)}${tail}`;
  });

  result = result.replace(/(stash@\{)(\d+)(\})/g, (_m, a, num, b) => {
    return `${a}${colorizeAnsi(num, "flag", subcommandId)}${b}`;
  });

  result = result.replace(/\b([0-9a-f]{7,})\b/gi, (match) => colorizeAnsi(match, "flag", subcommandId));

  return result + "\x1b[0m";
}

function highlightSuccessLine(line: string): string {
  if (line.startsWith("real>")) {
    return `${colorizeAnsi("real>", "plain")}${line.slice(5)}\x1b[0m`;
  }
  return `${colorizeAnsi(line, "plain")}\x1b[0m`;
}

function highlightErrorLine(line: string): string {
  return `\x1b[31m${line}\x1b[0m`;
}

export function highlightLine(line: string): string {
  const kind = classifyLine(line);

  switch (kind) {
    case "system":
      return `\x1b[38;5;30m${line}\x1b[0m`;
    case "error":
      return highlightErrorLine(line);
    case "success":
      return highlightSuccessLine(line);
    case "command": {
      const body = line.replace(/^\$ /, "");
      const subcommandId = resolveShortcutColorId(body);
      const prefix = `${colorizeAnsi("$", "plain", subcommandId)} `;
      return prefix + highlightGitTokensAnsi(body) + "\x1b[0m";
    }
    case "gitOutput":
      return highlightGitOutput(line);
    default:
      return line;
  }
}

export function highlightPrompt(buffer: string): string {
  const prompt = `${colorizeAnsi("$", "plain")} `;
  const body = buffer.length > 0 && /\bgit\b/i.test(buffer) ? highlightGitTokensAnsi(buffer) : buffer;
  return prompt + body + "\x1b[0m";
}
