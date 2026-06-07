export type LineKind = "system" | "error" | "success" | "command" | "gitOutput" | "plain";

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  orange: "\x1b[38;5;208m",
  dimCyan: "\x1b[38;5;30m",
  dimGreen: "\x1b[38;5;70m",
};

const GIT_SUBCOMMANDS = new Set([
  "init",
  "status",
  "add",
  "commit",
  "log",
  "diff",
  "branch",
  "checkout",
  "switch",
  "merge",
  "rebase",
  "remote",
  "fetch",
  "push",
  "pull",
  "clone",
  "stash",
  "reset",
  "restore",
  "revert",
  "rm",
]);

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

export function highlightGitTokens(cmd: string): string {
  const tokens = cmd.match(/("[^"]*"|'[^']*'|\S+|\s+)/g) ?? [cmd];
  let seenGit = false;
  let seenSubcommand = false;
  let output = "";

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      output += token;
      continue;
    }

    const lower = token.toLowerCase();
    if (!seenGit && lower === "git") {
      output += `${ANSI.green}git${ANSI.reset}`;
      seenGit = true;
      continue;
    }

    if (seenGit && !seenSubcommand && GIT_SUBCOMMANDS.has(lower)) {
      output += `${ANSI.cyan}${token}${ANSI.reset}`;
      seenSubcommand = true;
      continue;
    }

    if (/^-{1,2}[\w-]+$/.test(token)) {
      output += `${ANSI.yellow}${token}${ANSI.reset}`;
      continue;
    }

    if (/^["']/.test(token)) {
      output += `${ANSI.orange}${token}${ANSI.reset}`;
      continue;
    }

    output += token;
  }

  return output;
}

function highlightCommandLine(line: string): string {
  const prefixMatch = line.match(/^(\$ |: )/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const body = line.slice(prefix.length);
    const prompt = prefix.startsWith("$")
      ? `${ANSI.dimGreen}$${ANSI.reset} `
      : `${ANSI.dimGreen}:${ANSI.reset} `;
    return prompt + highlightGitTokens(body) + ANSI.reset;
  }
  return highlightGitTokens(line) + ANSI.reset;
}

function highlightGitOutput(line: string): string {
  let result = line;

  result = result.replace(/\[([^\]]+)\s+([0-9a-f]{4,})\]/gi, (_m, branch, hash) => {
    return `[${branch} ${ANSI.yellow}${hash}${ANSI.reset}]`;
  });

  result = result.replace(/(\d+)(\s+files?\s+changed)/gi, `${ANSI.yellow}$1${ANSI.reset}$2`);

  result = result.replace(/(stash@\{)(\d+)(\})/g, `$1${ANSI.yellow}$2${ANSI.reset}$3`);

  result = result.replace(/\b([0-9a-f]{7,})\b/gi, (match) => `${ANSI.yellow}${match}${ANSI.reset}`);

  return result + ANSI.reset;
}

function highlightSuccessLine(line: string): string {
  if (line.startsWith("real>")) {
    return `${ANSI.cyan}real>${ANSI.reset}${line.slice(5)}${ANSI.reset}`;
  }
  return `${ANSI.cyan}${line}${ANSI.reset}`;
}

function highlightErrorLine(line: string): string {
  return `${ANSI.red}${line}${ANSI.reset}`;
}

export function highlightLine(line: string): string {
  const kind = classifyLine(line);

  switch (kind) {
    case "system":
      return `${ANSI.dimCyan}${line}${ANSI.reset}`;
    case "error":
      return highlightErrorLine(line);
    case "success":
      return highlightSuccessLine(line);
    case "command":
      return highlightCommandLine(line);
    case "gitOutput":
      return highlightGitOutput(line);
    default:
      return line;
  }
}

export function highlightPrompt(buffer: string): string {
  const prompt = `${ANSI.dimGreen}$${ANSI.reset} `;
  const body = buffer.length > 0 && /\bgit\b/i.test(buffer) ? highlightGitTokens(buffer) : buffer;
  return prompt + body + ANSI.reset;
}
