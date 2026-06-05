import type { LessonWorld } from "./types";
import { cmdAny, cmdIncludes, cmdIs, hasBranch, hasRemote } from "./helpers";

export const worlds: LessonWorld[] = [
  {
    id: "world1",
    title: "World 1 - 初始化仓库",
    description: "从 git init 开始，完成第一次提交并查看历史。",
    mode: "sim",
    steps: [
      {
        id: "w1-init",
        title: "初始化仓库",
        instruction: "输入 git init，在本地创建 Git 仓库。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w1-add-all",
        title: "暂存所有文件",
        instruction: "输入 git add .，把当前目录改动加入暂存区。",
        commandHint: "git add .",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.index.length > 0 && cmdIs("git add")(command),
      },
      {
        id: "w1-commit",
        title: "首次提交",
        instruction: "输入 git commit -m \"first commit\"，创建第一个提交。",
        commandHint: 'git commit -m "first commit"',
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.commits.length >= 1 && cmdIs("git commit")(command),
      },
      {
        id: "w1-log-oneline",
        title: "单行历史",
        instruction: "输入 git log --oneline，用简洁格式查看提交历史。",
        commandHint: "git log --oneline",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git log", "--oneline")(command),
      },
      {
        id: "w1-status",
        title: "确认状态",
        instruction: "输入 git status，确认工作区是否干净。",
        commandHint: "git status",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git status")(command),
      },
    ],
  },
  {
    id: "world2",
    title: "World 2 - 连接 GitHub",
    description: "学习 branch -M、remote add 与首次 push -u。",
    mode: "sim",
    steps: [
      {
        id: "w2-init",
        title: "准备仓库",
        instruction: "先执行 git init，再 add/commit（可重复本关前几步命令）。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.initialized && (cmdIs("git init")(command) || cmdIs("git add")(command) || cmdIs("git commit")(command)),
      },
      {
        id: "w2-branch-m",
        title: "统一默认分支",
        instruction: "输入 git branch -M main，把当前分支命名为 main。",
        commandHint: "git branch -M main",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.head === "main" && cmdIncludes("git branch", "-M", "main")(command),
      },
      {
        id: "w2-remote-add",
        title: "关联远程",
        instruction: "输入 git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git",
        commandHint: "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git",
        riskLevel: "basic",
        validate: (snapshot, command) => hasRemote(snapshot, "origin") && cmdIs("git remote add")(command),
      },
      {
        id: "w2-push-u",
        title: "首次推送",
        instruction: "输入 git push -u origin main，建立上游跟踪关系。",
        commandHint: "git push -u origin main",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.upstreamSet &&
          snapshot.refs.some((r) => r.type === "remote" && r.name === "origin/main") &&
          cmdIncludes("git push", "-u")(command),
      },
    ],
  },
  {
    id: "world3",
    title: "World 3 - 克隆与同步",
    description: "掌握 clone、fetch、pull 与 pull --rebase。",
    mode: "sim",
    steps: [
      {
        id: "w3-clone",
        title: "克隆仓库",
        instruction: "输入 git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git",
        commandHint: "git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && hasRemote(snapshot, "origin") && cmdIs("git clone")(command),
      },
      {
        id: "w3-fetch",
        title: "拉取远端对象",
        instruction: "输入 git fetch，获取远程更新但不自动合并。",
        commandHint: "git fetch",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.refs.some((r) => r.type === "remote") && cmdIs("git fetch")(command),
      },
      {
        id: "w3-pull",
        title: "拉取并合并",
        instruction: "输入 git pull，拉取并合并到当前分支。",
        commandHint: "git pull",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git pull")(command) && !command.includes("--rebase"),
      },
      {
        id: "w3-pull-rebase",
        title: "拉取并变基",
        instruction: "输入 git pull --rebase，在团队约定允许时使用线性历史。",
        commandHint: "git pull --rebase",
        riskLevel: "advanced",
        riskNote: "仅在团队约定使用 rebase 时执行。",
        validate: (_snapshot, command) => cmdIncludes("git pull", "--rebase")(command),
      },
    ],
  },
  {
    id: "world4",
    title: "World 4 - 状态与诊断",
    description: "用 status、diff、remote -v 诊断仓库状态。",
    mode: "sim",
    steps: [
      {
        id: "w4-init",
        title: "准备环境",
        instruction: "输入 git init 开始本关练习。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w4-status",
        title: "查看状态",
        instruction: "输入 git status，查看工作区与暂存区。",
        commandHint: "git status",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git status")(command),
      },
      {
        id: "w4-diff",
        title: "未暂存差异",
        instruction: "输入 git diff，查看尚未暂存的改动。",
        commandHint: "git diff",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git diff")(command) && !command.includes("--staged"),
      },
      {
        id: "w4-diff-staged",
        title: "已暂存差异",
        instruction: "先 git add README.md，再执行 git diff --staged。",
        commandHint: "git diff --staged",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          (snapshot.index.length > 0 && cmdIncludes("git diff", "--staged")(command)) ||
          cmdIs("git add")(command),
      },
      {
        id: "w4-remote-v",
        title: "查看远程地址",
        instruction: "输入 git remote add origin https://github.com/demo/repo.git，再执行 git remote -v。",
        commandHint: "git remote -v",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          (hasRemote(snapshot, "origin") && cmdAny(["git remote -v", "git remote"])(command)) ||
          cmdIs("git remote add")(command),
      },
    ],
  },
  {
    id: "world5",
    title: "World 5 - 提交流程",
    description: "练习 add、commit -m 与 commit -am 的常见提交流程。",
    mode: "sim",
    steps: [
      {
        id: "w5-init",
        title: "初始化",
        instruction: "输入 git init。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w5-add-file",
        title: "暂存单文件",
        instruction: "输入 git add README.md。",
        commandHint: "git add README.md",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.index.includes("README.md") && cmdIs("git add")(command),
      },
      {
        id: "w5-commit-m",
        title: "带说明提交",
        instruction: "输入 git commit -m \"init\"。",
        commandHint: 'git commit -m "init"',
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.commits.length >= 1 && cmdIs("git commit")(command),
      },
      {
        id: "w5-add-all",
        title: "暂存全部",
        instruction: "输入 git add .（本关会模拟新的工作区改动）。",
        commandHint: "git add .",
        riskLevel: "basic",
        validate: (snapshot, command) => cmdIs("git add")(command) && snapshot.index.length > 0,
      },
      {
        id: "w5-commit-am",
        title: "跳过 add 提交",
        instruction: "输入 git commit -am \"quick update\"，对已跟踪文件直接提交。",
        commandHint: 'git commit -am "quick update"',
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git commit", "-am")(command) || cmdIncludes("git commit", "-a")(command),
      },
    ],
  },
  {
    id: "world6",
    title: "World 6 - 分支操作",
    description: "掌握 branch、checkout、switch 与创建并切换。",
    mode: "sim",
    steps: [
      {
        id: "w6-init",
        title: "准备仓库",
        instruction: "输入 git init 并至少完成一次提交（init -> add . -> commit）。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.initialized &&
          (cmdIs("git init")(command) || cmdIs("git add")(command) || (snapshot.commits.length > 0 && cmdIs("git commit")(command))),
      },
      {
        id: "w6-branch-list",
        title: "列出分支",
        instruction: "输入 git branch 查看本地分支。",
        commandHint: "git branch",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git branch")(command) && !command.includes("-"),
      },
      {
        id: "w6-branch-create",
        title: "创建分支",
        instruction: "输入 git branch feature。",
        commandHint: "git branch feature",
        riskLevel: "basic",
        validate: (snapshot, command) => hasBranch(snapshot, "feature") && cmdIncludes("git branch", "feature")(command),
      },
      {
        id: "w6-switch-c",
        title: "创建并切换 (switch)",
        instruction: "输入 git switch -c hotfix。",
        commandHint: "git switch -c hotfix",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          (snapshot.head === "hotfix" && cmdIncludes("git switch", "-c")(command)) ||
          (hasBranch(snapshot, "hotfix") && cmdIs("git switch")(command)),
      },
      {
        id: "w6-checkout-b",
        title: "创建并切换 (checkout)",
        instruction: "输入 git checkout -b develop。",
        commandHint: "git checkout -b develop",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.head === "develop" && cmdIncludes("git checkout", "-b")(command),
      },
    ],
  },
  {
    id: "world7",
    title: "World 7 - 合并与变基",
    description: "理解 merge 与 rebase 对分支历史的影响。",
    mode: "sim",
    steps: [
      {
        id: "w7-setup",
        title: "准备分支",
        instruction: "完成 init、提交，并创建 feature 分支（git branch feature）。",
        commandHint: "git branch feature",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          hasBranch(snapshot, "feature") ||
          cmdIs("git init")(command) ||
          cmdIs("git add")(command) ||
          cmdIs("git commit")(command) ||
          cmdIs("git branch")(command),
      },
      {
        id: "w7-merge",
        title: "合并分支",
        instruction: "切换到 feature 后输入 git merge main。",
        commandHint: "git merge main",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.commits.some((c) => c.parents.length > 1) && cmdIs("git merge")(command),
      },
      {
        id: "w7-rebase",
        title: "变基分支",
        instruction: "输入 git rebase main，观察指针重定位。",
        commandHint: "git rebase main",
        riskLevel: "advanced",
        riskNote: "rebase 会改写历史，公共分支慎用。",
        validate: (_snapshot, command) => cmdIs("git rebase")(command),
      },
    ],
  },
  {
    id: "world8",
    title: "World 8 - 暂存现场",
    description: "用 stash 临时保存工作区，稍后恢复。",
    mode: "sim",
    steps: [
      {
        id: "w8-init",
        title: "准备改动",
        instruction: "输入 git init，确保工作区有未提交改动（默认有 README.md）。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w8-stash",
        title: "收起改动",
        instruction: "输入 git stash，把工作区改动暂存起来。",
        commandHint: "git stash",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.stashCount >= 1 && cmdIs("git stash")(command) && !command.includes("pop") && !command.includes("list"),
      },
      {
        id: "w8-stash-list",
        title: "查看 stash",
        instruction: "输入 git stash list。",
        commandHint: "git stash list",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git stash", "list")(command),
      },
      {
        id: "w8-stash-pop",
        title: "恢复 stash",
        instruction: "输入 git stash pop，恢复最近一次暂存。",
        commandHint: "git stash pop",
        riskLevel: "basic",
        validate: (snapshot, command) => cmdIncludes("git stash", "pop")(command) && snapshot.stashCount === 0,
      },
    ],
  },
  {
    id: "world9",
    title: "World 9 - 撤销基础",
    description: "学习 restore 与 reset 的温和撤销方式。",
    mode: "sim",
    steps: [
      {
        id: "w9-init-commit",
        title: "建立基线提交",
        instruction: "依次完成 git init -> git add . -> git commit -m \"base\"。",
        commandHint: 'git commit -m "base"',
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.commits.length >= 1 ||
          cmdIs("git init")(command) ||
          cmdIs("git add")(command) ||
          cmdIs("git commit")(command),
      },
      {
        id: "w9-restore-staged",
        title: "取消暂存",
        instruction: "先 git add README.md，再执行 git restore --staged README.md。",
        commandHint: "git restore --staged README.md",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          (cmdIncludes("git restore", "--staged")(command) && !snapshot.index.includes("README.md")) ||
          cmdIs("git add")(command),
      },
      {
        id: "w9-restore-file",
        title: "丢弃工作区修改",
        instruction: "输入 git restore README.md，丢弃未提交修改。",
        commandHint: "git restore README.md",
        riskLevel: "basic",
        validate: (_snapshot, command) =>
          cmdIs("git restore")(command) && !command.includes("--staged"),
      },
      {
        id: "w9-reset-head",
        title: "取消暂存（旧写法）",
        instruction: "输入 git reset HEAD README.md（等效 restore --staged）。",
        commandHint: "git reset HEAD README.md",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git reset", "HEAD")(command),
      },
      {
        id: "w9-reset-soft",
        title: "软回退",
        instruction: "输入 git reset --soft HEAD~1，回退提交但保留暂存。",
        commandHint: "git reset --soft HEAD~1",
        riskLevel: "advanced",
        riskNote: "仅适用于未 push 的本地提交。",
        validate: (_snapshot, command) => cmdIncludes("git reset", "--soft")(command),
      },
    ],
  },
  {
    id: "world10",
    title: "World 10 - 风险与回滚",
    description: "学习 amend、revert 与高风险 reset --hard。",
    mode: "sim",
    steps: [
      {
        id: "w10-setup",
        title: "准备提交",
        instruction: "完成 init -> add . -> commit -m \"release\"。",
        commandHint: 'git commit -m "release"',
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.commits.length >= 1 ||
          cmdIs("git init")(command) ||
          cmdIs("git add")(command) ||
          cmdIs("git commit")(command),
      },
      {
        id: "w10-amend",
        title: "修改最近提交",
        instruction: "输入 git commit --amend -m \"release v2\"。",
        commandHint: 'git commit --amend -m "release v2"',
        riskLevel: "advanced",
        riskNote: "仅适用于未 push 的最后一次提交。",
        validate: (_snapshot, command) => cmdIncludes("git commit", "--amend")(command),
      },
      {
        id: "w10-revert",
        title: "反向提交回滚",
        instruction: "输入 git revert HEAD（团队协作推荐方式）。",
        commandHint: "git revert HEAD",
        riskLevel: "advanced",
        riskNote: "已 push 历史优先使用 revert，而不是 reset --hard。",
        validate: (snapshot, command) =>
          cmdIs("git revert")(command) && snapshot.commits.some((c) => c.message.startsWith("Revert")),
      },
      {
        id: "w10-reset-hard",
        title: "硬回退（危险）",
        instruction: "输入 git reset --hard HEAD~1，体验高风险回退。",
        commandHint: "git reset --hard HEAD~1",
        riskLevel: "danger",
        riskNote: "危险：会丢弃提交与改动。公共分支请改用 git revert。",
        validate: (_snapshot, command) => cmdIncludes("git reset", "--hard")(command),
      },
    ],
  },
  {
    id: "world11",
    title: "World 11 - 忽略规则",
    description: "学习 .gitignore 与停止跟踪已提交文件。",
    mode: "sim",
    steps: [
      {
        id: "w11-init",
        title: "初始化",
        instruction: "输入 git init。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w11-gitignore",
        title: "添加忽略文件",
        instruction: "输入 git add .gitignore，创建忽略规则。",
        commandHint: "git add .gitignore",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.hasGitignore && cmdIncludes("git add", ".gitignore")(command),
      },
      {
        id: "w11-add-tracked",
        title: "暂存业务文件",
        instruction: "输入 git add README.md 并 commit -m \"track files\"。",
        commandHint: 'git commit -m "track files"',
        riskLevel: "basic",
        validate: (snapshot, command) =>
          snapshot.commits.length >= 1 ||
          cmdIs("git add")(command) ||
          cmdIs("git commit")(command),
      },
      {
        id: "w11-rm-cached",
        title: "停止跟踪",
        instruction: "输入 git rm -r --cached README.md，保留文件但停止跟踪。",
        commandHint: "git rm -r --cached README.md",
        riskLevel: "advanced",
        riskNote: "配合 .gitignore 修正误跟踪文件。",
        validate: (snapshot, command) =>
          cmdIncludes("git rm", "--cached")(command) && !snapshot.index.includes("README.md"),
      },
    ],
  },
  {
    id: "world12",
    title: "World 12 - 协作收尾",
    description: "PR 前同步远程、检查差异并更新 remote 地址。",
    mode: "sim",
    steps: [
      {
        id: "w12-setup",
        title: "准备远程",
        instruction: "完成 init、提交，并添加 origin 远程。",
        commandHint: "git remote add origin https://github.com/demo/repo.git",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          hasRemote(snapshot, "origin") ||
          cmdIs("git init")(command) ||
          cmdIs("git add")(command) ||
          cmdIs("git commit")(command) ||
          cmdIs("git remote add")(command),
      },
      {
        id: "w12-fetch",
        title: "同步远程",
        instruction: "输入 git fetch origin。",
        commandHint: "git fetch origin",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git fetch", "origin")(command),
      },
      {
        id: "w12-rebase-origin",
        title: "变基到远程 main",
        instruction: "输入 git rebase origin/main，保持功能分支线性。",
        commandHint: "git rebase origin/main",
        riskLevel: "advanced",
        riskNote: "仅在个人分支且团队允许 rebase 时使用。",
        validate: (_snapshot, command) => cmdIncludes("git rebase", "origin/main")(command),
      },
      {
        id: "w12-log-range",
        title: "查看领先提交",
        instruction: "输入 git log origin/main..HEAD，查看本地多出的提交。",
        commandHint: "git log origin/main..HEAD",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIncludes("git log", "origin/main..HEAD")(command),
      },
      {
        id: "w12-remote-set-url",
        title: "修改远程地址",
        instruction: "输入 git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO.git",
        commandHint: "git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO.git",
        riskLevel: "basic",
        validate: (snapshot, command) =>
          hasRemote(snapshot, "origin") &&
          snapshot.remotes[0]?.url.includes("git@github.com") &&
          cmdIncludes("git remote", "set-url")(command),
      },
    ],
  },
  {
    id: "world13",
    title: "World 13 - 真实沙盒收官",
    description: "在 Real 模式完成 init -> add -> commit -> log，迁移 Sim 所学。",
    mode: "real",
    steps: [
      {
        id: "w13-init",
        title: "真实引擎初始化",
        instruction: "输入 git init。远端/撤销等高级命令请回到 Sim 关卡练习。",
        commandHint: "git init",
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w13-add",
        title: "真实暂存",
        instruction: "输入 git add demo.txt（Real 模式会自动创建演示文件）。",
        commandHint: "git add demo.txt",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git add")(command),
      },
      {
        id: "w13-commit",
        title: "真实提交",
        instruction: "输入 git commit -m \"real sandbox\"。",
        commandHint: 'git commit -m "real sandbox"',
        riskLevel: "basic",
        validate: (snapshot, command) => snapshot.commits.length >= 1 && cmdIs("git commit")(command),
      },
      {
        id: "w13-log",
        title: "真实历史",
        instruction: "输入 git log，确认浏览器内真实 Git 已产生提交。",
        commandHint: "git log",
        riskLevel: "basic",
        validate: (_snapshot, command) => cmdIs("git log")(command),
      },
    ],
  },
];
