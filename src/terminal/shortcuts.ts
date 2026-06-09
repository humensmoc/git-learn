export type InputPicker = "branch" | "file";

export interface ShortcutHelp {
  purpose: string;
  effect: string;
  scenario: string;
}

export interface ShortcutOption {
  id: string;
  label: string;
  suffix: string;
  help?: ShortcutHelp;
  exampleCommand?: string;
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
  help?: ShortcutHelp;
  options?: ShortcutOption[];
  directSuffix?: string;
}

const quote = (value: string) => `"${value.replaceAll('"', '\\"')}"`;

export const gitShortcuts: GitShortcut[] = [
  {
    id: "init",
    label: "init",
    prefix: "git init",
    directSuffix: "",
    help: {
      purpose: "初始化当前目录为 Git 仓库。",
      effect: "执行 git init。",
      scenario: "第一次给本地项目接入 Git。",
    },
  },
  {
    id: "status",
    label: "status",
    prefix: "git status",
    directSuffix: "",
    help: {
      purpose: "查看工作区和暂存区当前状态。",
      effect: "执行 git status。",
      scenario: "提交前先确认有哪些文件变化。",
    },
    options: [
      {
        id: "short",
        label: "-s",
        suffix: " -s",
        help: {
          purpose: "以短格式查看状态。",
          effect: "执行 git status -s。",
          scenario: "你只想快速扫一眼变更清单。",
        },
      },
      {
        id: "short-branch",
        label: "-sb",
        suffix: " -sb",
        help: {
          purpose: "短格式同时显示当前分支和跟踪状态。",
          effect: "执行 git status -sb。",
          scenario: "协作时快速确认分支是否落后/领先远程。",
        },
      },
    ],
  },
  {
    id: "add",
    label: "add",
    prefix: "git add",
    help: {
      purpose: "把改动加入暂存区，为提交做准备。",
      effect: "执行 git add ...。",
      scenario: "选择本次提交要包含的文件。",
    },
    options: [
      {
        id: "dot",
        label: ".",
        suffix: " .",
        help: {
          purpose: "暂存当前目录下所有变化。",
          effect: "执行 git add .。",
          scenario: "本次改动都要一起提交。",
        },
      },
      {
        id: "readme",
        label: "README.md",
        suffix: " README.md",
        help: {
          purpose: "只暂存 README.md 文件。",
          effect: "执行 git add README.md。",
          scenario: "只想提交文档修改。",
        },
      },
      {
        id: "all",
        label: "-A",
        suffix: " -A",
        help: {
          purpose: "暂存所有新增、修改、删除。",
          effect: "执行 git add -A。",
          scenario: "需要把删除操作也一并提交。",
        },
      },
      {
        id: "file",
        label: "file",
        suffix: "",
        exampleCommand: "git add demo.txt",
        help: {
          purpose: "手动输入目标文件进行精确暂存。",
          effect: "执行 git add <file>。",
          scenario: "一次只提交某个文件，避免混入无关改动。",
        },
        input: { placeholder: "文件名，如 demo.txt", wrap: (v) => ` ${v}`, picker: "file" },
      },
    ],
  },
  {
    id: "commit",
    label: "commit",
    prefix: "git commit",
    help: {
      purpose: "把暂存区内容保存为提交快照。",
      effect: "执行 git commit ...。",
      scenario: "完成一个可描述的修改单元后提交。",
    },
    options: [
      {
        id: "m",
        label: "-m",
        suffix: "",
        exampleCommand: 'git commit -m "feat: add login"',
        help: {
          purpose: "带提交说明创建提交。",
          effect: "执行 git commit -m \"message\"。",
          scenario: "常规提交时明确说明本次改动。",
        },
        input: { placeholder: "提交说明", wrap: (v) => ` -m ${quote(v)}` },
      },
      {
        id: "am",
        label: "-am",
        suffix: "",
        exampleCommand: 'git commit -am "quick fix"',
        help: {
          purpose: "对已跟踪文件跳过 add 直接提交。",
          effect: "执行 git commit -am \"message\"。",
          scenario: "紧急小改且没有新文件时快速提交。",
        },
        input: { placeholder: "提交说明", wrap: (v) => ` -am ${quote(v)}` },
      },
      {
        id: "amend",
        label: "--amend",
        suffix: "",
        exampleCommand: 'git commit --amend -m "refine message"',
        help: {
          purpose: "修改最近一次提交内容或说明。",
          effect: "执行 git commit --amend ...。",
          scenario: "刚提交后发现漏文件或提交信息不准确。",
        },
        input: { placeholder: "修正说明（可留空）", wrap: (v) => (v ? ` --amend -m ${quote(v)}` : " --amend") },
      },
    ],
  },
  {
    id: "branch",
    label: "branch",
    prefix: "git branch",
    help: {
      purpose: "管理本地分支（查看、创建、重命名）。",
      effect: "执行 git branch ...。",
      scenario: "功能开发前先建立独立分支。",
    },
    options: [
      {
        id: "list",
        label: "list",
        suffix: "",
        help: {
          purpose: "列出本地分支。",
          effect: "执行 git branch。",
          scenario: "切分支前确认当前有哪些分支。",
        },
      },
      {
        id: "create",
        label: "create branch",
        suffix: "",
        exampleCommand: "git branch feature/login",
        help: {
          purpose: "创建新分支但不切换。",
          effect: "执行 git branch <name>。",
          scenario: "先批量建分支，再按需切换。",
        },
        input: { placeholder: "分支名，如 feature", wrap: (v) => ` ${v}` },
      },
      {
        id: "rename",
        label: "-M main",
        suffix: " -M main",
        help: {
          purpose: "强制把当前分支重命名为 main。",
          effect: "执行 git branch -M main。",
          scenario: "初始化仓库后统一默认分支名。",
        },
      },
    ],
  },
  {
    id: "checkout",
    label: "checkout",
    prefix: "git checkout",
    help: {
      purpose: "切换分支或创建并切换分支（旧写法）。",
      effect: "执行 git checkout ...。",
      scenario: "兼容旧项目或旧习惯时使用。",
    },
    options: [
      {
        id: "branch",
        label: "switch branch",
        suffix: "",
        exampleCommand: "git checkout main",
        help: {
          purpose: "切换到已有分支。",
          effect: "执行 git checkout <branch>。",
          scenario: "从 feature 回到 main 合并代码。",
        },
        input: { placeholder: "分支名", wrap: (v) => ` ${v}`, picker: "branch" },
      },
      {
        id: "new",
        label: "create -b",
        suffix: "",
        exampleCommand: "git checkout -b hotfix/login",
        help: {
          purpose: "创建并立即切换到新分支。",
          effect: "执行 git checkout -b <branch>。",
          scenario: "临时修复 bug 需要马上开新分支。",
        },
        input: { placeholder: "新分支名", wrap: (v) => ` -b ${v}`, picker: "branch" },
      },
    ],
  },
  {
    id: "switch",
    label: "switch",
    prefix: "git switch",
    help: {
      purpose: "以新命令方式切换分支。",
      effect: "执行 git switch ...。",
      scenario: "现代 Git 推荐用法，语义更清晰。",
    },
    options: [
      {
        id: "branch",
        label: "switch branch",
        suffix: "",
        exampleCommand: "git switch main",
        help: {
          purpose: "切换到已有分支。",
          effect: "执行 git switch <branch>。",
          scenario: "日常在多个分支之间切换开发。",
        },
        input: { placeholder: "分支名", wrap: (v) => ` ${v}`, picker: "branch" },
      },
      {
        id: "create",
        label: "create -c",
        suffix: "",
        exampleCommand: "git switch -c feature/cart",
        help: {
          purpose: "创建并切换到新分支。",
          effect: "执行 git switch -c <branch>。",
          scenario: "开始新功能时一键开分支并进入。",
        },
        input: { placeholder: "新分支名", wrap: (v) => ` -c ${v}` },
      },
    ],
  },
  {
    id: "merge",
    label: "merge",
    prefix: "git merge",
    help: {
      purpose: "把目标分支改动合并到当前分支。",
      effect: "执行 git merge <branch>。",
      scenario: "功能完成后合回主线。",
    },
    options: [
      {
        id: "target",
        label: "merge branch",
        suffix: "",
        exampleCommand: "git merge feature/login",
        help: {
          purpose: "指定要合并进来的分支。",
          effect: "执行 git merge <branch>。",
          scenario: "main 上合并 feature 分支。",
        },
        input: { placeholder: "分支名，如 main", wrap: (v) => ` ${v}`, picker: "branch" },
      },
    ],
  },
  {
    id: "diff",
    label: "diff",
    prefix: "git diff",
    directSuffix: "",
    help: {
      purpose: "查看代码差异，定位具体修改行。",
      effect: "执行 git diff ...。",
      scenario: "提交前复查改动，避免误提交。",
    },
    options: [
      {
        id: "staged",
        label: "--staged",
        suffix: " --staged",
        help: {
          purpose: "查看已暂存内容的差异。",
          effect: "执行 git diff --staged。",
          scenario: "确认本次 commit 将提交哪些改动。",
        },
      },
      {
        id: "name-only",
        label: "--name-only",
        suffix: " --name-only",
        help: {
          purpose: "只看改动文件名，不看具体内容。",
          effect: "执行 git diff --name-only。",
          scenario: "快速检查哪些文件受影响。",
        },
      },
      {
        id: "stat",
        label: "--stat",
        suffix: " --stat",
        help: {
          purpose: "按文件显示增删行统计。",
          effect: "执行 git diff --stat。",
          scenario: "评估改动规模与影响范围。",
        },
      },
      {
        id: "cached",
        label: "--cached",
        suffix: " --cached",
        help: {
          purpose: "查看已缓存（暂存）改动，等同 --staged。",
          effect: "执行 git diff --cached。",
          scenario: "你习惯使用 cached 命名时。",
        },
      },
    ],
  },
  {
    id: "stash",
    label: "stash",
    prefix: "git stash",
    help: {
      purpose: "临时收起未提交改动，稍后再恢复。",
      effect: "执行 git stash ...。",
      scenario: "改到一半需要切换任务或分支。",
    },
    options: [
      {
        id: "save",
        label: "save",
        suffix: "",
        help: {
          purpose: "将当前改动收起到 stash 栈。",
          effect: "执行 git stash。",
          scenario: "紧急插入任务前先保存现场。",
        },
      },
      {
        id: "list",
        label: "list",
        suffix: " list",
        help: {
          purpose: "查看 stash 记录列表。",
          effect: "执行 git stash list。",
          scenario: "确认有哪些暂存现场可恢复。",
        },
      },
      {
        id: "pop",
        label: "pop",
        suffix: " pop",
        help: {
          purpose: "恢复最近一条 stash 并从栈里移除。",
          effect: "执行 git stash pop。",
          scenario: "处理完紧急任务后继续原工作。",
        },
      },
    ],
  },
  {
    id: "log",
    label: "log",
    prefix: "git log",
    help: {
      purpose: "查看提交历史。",
      effect: "执行 git log ...。",
      scenario: "追踪改动来源或回顾提交脉络。",
    },
    options: [
      {
        id: "oneline",
        label: "--oneline",
        suffix: " --oneline",
        help: {
          purpose: "以单行方式展示历史。",
          effect: "执行 git log --oneline。",
          scenario: "快速浏览近期提交。",
        },
      },
      {
        id: "graph",
        label: "--graph",
        suffix: " --graph",
        help: {
          purpose: "以图形线条展示分支关系。",
          effect: "执行 git log --graph。",
          scenario: "排查 merge/rebase 后的历史结构。",
        },
      },
      {
        id: "decorate",
        label: "--decorate",
        suffix: " --decorate",
        help: {
          purpose: "显示分支与标签指向。",
          effect: "执行 git log --decorate。",
          scenario: "确认 HEAD、tag、branch 所在提交。",
        },
      },
    ],
  },
  {
    id: "push",
    label: "push",
    prefix: "git push",
    help: {
      purpose: "把本地分支提交推送到远程。",
      effect: "执行 git push ...。",
      scenario: "本地提交完成后同步到团队仓库。",
    },
    options: [
      {
        id: "u",
        label: "-u origin main",
        suffix: " -u origin main",
        help: {
          purpose: "首次推送并建立上游跟踪关系。",
          effect: "执行 git push -u origin main。",
          scenario: "新仓库第一次把 main 推到远程。",
        },
      },
      {
        id: "origin",
        label: "origin main",
        suffix: " origin main",
        help: {
          purpose: "将当前分支推到 origin/main。",
          effect: "执行 git push origin main。",
          scenario: "已有跟踪关系时常规推送。",
        },
      },
      {
        id: "force-with-lease",
        label: "--force-with-lease",
        suffix: " --force-with-lease",
        help: {
          purpose: "安全地强制推送，避免覆盖他人新提交。",
          effect: "执行 git push --force-with-lease。",
          scenario: "rebase 后更新个人分支，且需保护协作安全。",
        },
      },
    ],
  },
  {
    id: "pull",
    label: "pull",
    prefix: "git pull",
    help: {
      purpose: "从远程拉取并整合更新。",
      effect: "执行 git pull ...。",
      scenario: "开工前同步最新代码。",
    },
    options: [
      {
        id: "plain",
        label: "pull",
        suffix: "",
        help: {
          purpose: "拉取并 merge 到当前分支。",
          effect: "执行 git pull。",
          scenario: "默认协作流程下同步远程。",
        },
      },
      {
        id: "rebase",
        label: "--rebase",
        suffix: " --rebase",
        help: {
          purpose: "拉取后用 rebase 保持线性历史。",
          effect: "执行 git pull --rebase。",
          scenario: "团队约定使用 rebase 工作流。",
        },
      },
    ],
  },
  {
    id: "fetch",
    label: "fetch",
    prefix: "git fetch",
    help: {
      purpose: "从远程下载最新提交与引用，不自动合并。",
      effect: "执行 git fetch ...。",
      scenario: "先看远程更新，再决定 merge/rebase。",
    },
    options: [
      {
        id: "plain",
        label: "fetch",
        suffix: "",
        help: {
          purpose: "使用默认 origin 拉取远程引用。",
          effect: "执行 git fetch。",
          scenario: "仓库已配置 origin 的常规同步。",
        },
      },
      {
        id: "origin",
        label: "origin",
        suffix: " origin",
        help: {
          purpose: "明确指定从 origin 拉取。",
          effect: "执行 git fetch origin。",
          scenario: "多远程仓库场景下避免拉错。",
        },
      },
    ],
  },
  {
    id: "clone",
    label: "clone",
    prefix: "git clone",
    help: {
      purpose: "复制远程仓库到本地。",
      effect: "执行 git clone <url>。",
      scenario: "新电脑或第一次拿到项目代码。",
    },
    options: [
      {
        id: "url",
        label: "URL",
        suffix: "",
        exampleCommand: "git clone https://github.com/demo/repo.git",
        help: {
          purpose: "输入仓库地址并克隆。",
          effect: "执行 git clone <url>。",
          scenario: "根据仓库链接快速初始化本地工作区。",
        },
        input: {
          placeholder: "https://github.com/demo/repo.git",
          wrap: (v) => ` ${v}`,
        },
      },
    ],
  },
  {
    id: "remote",
    label: "remote",
    prefix: "git remote",
    help: {
      purpose: "管理远程仓库地址。",
      effect: "执行 git remote ...。",
      scenario: "连接、检查或切换 GitHub 仓库地址。",
    },
    options: [
      {
        id: "v",
        label: "-v",
        suffix: " -v",
        help: {
          purpose: "查看远程别名与 URL。",
          effect: "执行 git remote -v。",
          scenario: "确认 origin 指向是否正确。",
        },
      },
      {
        id: "add",
        label: "add origin",
        suffix: "",
        exampleCommand: "git remote add origin https://github.com/user/repo.git",
        help: {
          purpose: "新增远程仓库地址（默认建议用 origin）。",
          effect: "执行 git remote add origin <url>。",
          scenario: "本地仓库首次连接 GitHub 时最常用。",
        },
        input: {
          placeholder: "origin https://github.com/user/repo.git",
          wrap: (v) => ` add ${v}`,
        },
      },
      {
        id: "set-url",
        label: "set-url",
        suffix: "",
        exampleCommand: "git remote set-url origin git@github.com:user/repo.git",
        help: {
          purpose: "更新已有远程地址（如 HTTPS 切 SSH）。",
          effect: "执行 git remote set-url <name> <url>。",
          scenario: "仓库迁移或认证方式调整。",
        },
        input: {
          placeholder: "origin git@github.com:user/repo.git",
          wrap: (v) => ` set-url ${v}`,
        },
      },
    ],
  },
  {
    id: "reset",
    label: "reset",
    prefix: "git reset",
    help: {
      purpose: "回退提交或调整暂存区状态。",
      effect: "执行 git reset ...。",
      scenario: "本地提交有误，需要重做提交节奏。",
    },
    options: [
      {
        id: "soft",
        label: "--soft HEAD~1",
        suffix: " --soft HEAD~1",
        help: {
          purpose: "回退提交但保留暂存内容。",
          effect: "执行 git reset --soft HEAD~1。",
          scenario: "只想重写最近提交信息或拆分提交。",
        },
      },
      {
        id: "hard",
        label: "--hard HEAD~1",
        suffix: " --hard HEAD~1",
        help: {
          purpose: "强制回退并丢弃改动（危险）。",
          effect: "执行 git reset --hard HEAD~1。",
          scenario: "仅在本地可丢弃改动时使用。",
        },
      },
      {
        id: "staged",
        label: "HEAD file",
        suffix: " HEAD README.md",
        help: {
          purpose: "把文件从暂存区撤回工作区。",
          effect: "执行 git reset HEAD README.md。",
          scenario: "误 add 文件后快速取消暂存。",
        },
      },
    ],
  },
  {
    id: "restore",
    label: "restore",
    prefix: "git restore",
    help: {
      purpose: "恢复文件内容或撤销暂存。",
      effect: "执行 git restore ...。",
      scenario: "本地误改或误暂存时快速回退。",
    },
    options: [
      {
        id: "file",
        label: "file",
        suffix: " README.md",
        help: {
          purpose: "丢弃工作区文件改动，恢复到 HEAD。",
          effect: "执行 git restore README.md。",
          scenario: "试验失败后回退某个文件。",
        },
      },
      {
        id: "staged",
        label: "--staged",
        suffix: " --staged README.md",
        help: {
          purpose: "取消已暂存文件，保留工作区改动。",
          effect: "执行 git restore --staged README.md。",
          scenario: "提交前从暂存区移除误选文件。",
        },
      },
      {
        id: "source",
        label: "--source",
        suffix: "",
        exampleCommand: "git restore --source=HEAD~1 README.md",
        help: {
          purpose: "从指定提交恢复文件内容。",
          effect: "执行 git restore --source=<ref> <file>。",
          scenario: "要把单文件恢复到历史版本。",
        },
        input: {
          placeholder: "--source=HEAD~1 README.md",
          wrap: (v) => ` ${v}`,
        },
      },
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
