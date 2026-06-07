export type InputPicker = "branch" | "file";

export interface ShortcutOption {
  id: string;
  label: string;
  suffix: string;
  input?: {
    placeholder: string;
    wrap?: (value: string) => string;
    picker?: InputPicker;
  };
}

export interface GitShortcut {
  id: string;
  label: string;
  prefix: string;
  options?: ShortcutOption[];
  directSuffix?: string;
}

const quote = (value: string) => `"${value.replaceAll('"', '\\"')}"`;

export const gitShortcuts: GitShortcut[] = [
  { id: "init", label: "init", prefix: "git init", directSuffix: "" },
  { id: "status", label: "status", prefix: "git status", directSuffix: "" },
  {
    id: "add",
    label: "add",
    prefix: "git add",
    options: [
      { id: "dot", label: ".", suffix: " ." },
      { id: "readme", label: "README.md", suffix: " README.md" },
      { id: "all", label: "-A", suffix: " -A" },
      {
        id: "file",
        label: "指定文件",
        suffix: "",
        input: { placeholder: "文件名，如 demo.txt", wrap: (v) => ` ${v}`, picker: "file" },
      },
    ],
  },
  {
    id: "commit",
    label: "commit",
    prefix: "git commit",
    options: [
      {
        id: "m",
        label: "-m",
        suffix: "",
        input: { placeholder: "提交说明", wrap: (v) => ` -m ${quote(v)}` },
      },
      {
        id: "am",
        label: "-am",
        suffix: "",
        input: { placeholder: "提交说明", wrap: (v) => ` -am ${quote(v)}` },
      },
      {
        id: "amend",
        label: "--amend",
        suffix: "",
        input: { placeholder: "修正说明（可留空）", wrap: (v) => (v ? ` --amend -m ${quote(v)}` : " --amend") },
      },
    ],
  },
  {
    id: "branch",
    label: "branch",
    prefix: "git branch",
    options: [
      { id: "list", label: "列表", suffix: "" },
      {
        id: "create",
        label: "新建分支",
        suffix: "",
        input: { placeholder: "分支名，如 feature", wrap: (v) => ` ${v}` },
      },
      {
        id: "rename",
        label: "-M main",
        suffix: " -M main",
      },
    ],
  },
  {
    id: "checkout",
    label: "checkout",
    prefix: "git checkout",
    options: [
      {
        id: "branch",
        label: "切换分支",
        suffix: "",
        input: { placeholder: "分支名", wrap: (v) => ` ${v}`, picker: "branch" },
      },
      {
        id: "new",
        label: "新建分支 -b",
        suffix: "",
        input: { placeholder: "新分支名", wrap: (v) => ` -b ${v}`, picker: "branch" },
      },
    ],
  },
  {
    id: "switch",
    label: "switch",
    prefix: "git switch",
    options: [
      {
        id: "branch",
        label: "切换分支",
        suffix: "",
        input: { placeholder: "分支名", wrap: (v) => ` ${v}`, picker: "branch" },
      },
      {
        id: "create",
        label: "新建分支 -c",
        suffix: "",
        input: { placeholder: "新分支名", wrap: (v) => ` -c ${v}` },
      },
    ],
  },
  {
    id: "merge",
    label: "merge",
    prefix: "git merge",
    options: [
      {
        id: "target",
        label: "合并分支",
        suffix: "",
        input: { placeholder: "分支名，如 main", wrap: (v) => ` ${v}`, picker: "branch" },
      },
    ],
  },
  {
    id: "stash",
    label: "stash",
    prefix: "git stash",
    options: [
      { id: "save", label: "save", suffix: "" },
      { id: "list", label: "list", suffix: " list" },
      { id: "pop", label: "pop", suffix: " pop" },
    ],
  },
  { id: "log", label: "log", prefix: "git log", options: [{ id: "oneline", label: "--oneline", suffix: " --oneline" }] },
  {
    id: "push",
    label: "push",
    prefix: "git push",
    options: [
      { id: "u", label: "-u origin main", suffix: " -u origin main" },
      { id: "origin", label: "origin main", suffix: " origin main" },
    ],
  },
  {
    id: "pull",
    label: "pull",
    prefix: "git pull",
    options: [
      { id: "plain", label: "pull", suffix: "" },
      { id: "rebase", label: "--rebase", suffix: " --rebase" },
    ],
  },
  {
    id: "remote",
    label: "remote",
    prefix: "git remote",
    options: [
      { id: "v", label: "-v", suffix: " -v" },
      {
        id: "add",
        label: "添加远程",
        suffix: "",
        input: {
          placeholder: "origin https://github.com/user/repo.git",
          wrap: (v) => ` add ${v}`,
        },
      },
    ],
  },
  {
    id: "reset",
    label: "reset",
    prefix: "git reset",
    options: [
      { id: "soft", label: "--soft HEAD~1", suffix: " --soft HEAD~1" },
      { id: "hard", label: "--hard HEAD~1", suffix: " --hard HEAD~1" },
      { id: "staged", label: "HEAD file", suffix: " HEAD README.md" },
    ],
  },
  {
    id: "restore",
    label: "restore",
    prefix: "git restore",
    options: [
      { id: "file", label: "文件", suffix: " README.md" },
      { id: "staged", label: "--staged", suffix: " --staged README.md" },
    ],
  },
];

export function buildShortcutCommand(shortcut: GitShortcut, option?: ShortcutOption, inputValue?: string): string {
  if (!shortcut.options?.length) {
    return `${shortcut.prefix}${shortcut.directSuffix ?? ""}`.trim();
  }
  if (!option) return shortcut.prefix;
  const extra = option.input && inputValue !== undefined ? option.input.wrap?.(inputValue) ?? "" : option.suffix;
  return `${shortcut.prefix}${extra}`.trim();
}
