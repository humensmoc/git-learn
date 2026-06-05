import type { LessonWorld } from "./types";

const cmdIs = (prefix: string) => (command: string) => command.trim().startsWith(prefix);

export const worlds: LessonWorld[] = [
  {
    id: "world1",
    title: "World 1 - 创建仓库",
    description: "从 git init 开始，完成第一次提交。",
    mode: "sim",
    steps: [
      {
        id: "w1-init",
        title: "初始化仓库",
        instruction: "输入 git init，创建你的第一个仓库。",
        commandHint: "git init",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w1-status",
        title: "查看状态",
        instruction: "输入 git status，确认当前分支和工作区状态。",
        commandHint: "git status",
        validate: (_snapshot, command) => cmdIs("git status")(command),
      },
      {
        id: "w1-add",
        title: "暂存文件",
        instruction: "输入 git add README.md，把文件加入暂存区。",
        commandHint: "git add README.md",
        validate: (snapshot, command) => snapshot.index.includes("README.md") && cmdIs("git add")(command),
      },
      {
        id: "w1-commit",
        title: "创建首次提交",
        instruction: "输入 git commit -m \"init\"，生成第一个 commit。",
        commandHint: "git commit -m \"init\"",
        validate: (snapshot, command) => snapshot.commits.length >= 1 && cmdIs("git commit")(command),
      },
      {
        id: "w1-log",
        title: "查看历史",
        instruction: "输入 git log，确认你已经有提交历史。",
        commandHint: "git log",
        validate: (_snapshot, command) => cmdIs("git log")(command),
      },
    ],
  },
  {
    id: "world2",
    title: "World 2 - 分支",
    description: "学习 branch 与 checkout/switch。",
    mode: "sim",
    steps: [
      {
        id: "w2-branch",
        title: "创建分支",
        instruction: "输入 git branch feature，创建功能分支。",
        commandHint: "git branch feature",
        validate: (snapshot, command) =>
          snapshot.refs.some((ref) => ref.type === "branch" && ref.name === "feature") && cmdIs("git branch")(command),
      },
      {
        id: "w2-checkout",
        title: "切换分支",
        instruction: "输入 git checkout feature 切换到 feature。",
        commandHint: "git checkout feature",
        validate: (snapshot, command) => snapshot.head === "feature" && cmdIs("git checkout")(command),
      },
    ],
  },
  {
    id: "world3",
    title: "World 3 - 合并与变基",
    description: "理解 merge 和 rebase 的结果。",
    mode: "sim",
    steps: [
      {
        id: "w3-merge",
        title: "执行 merge",
        instruction: "输入 git merge main，把 main 合并到当前分支。",
        commandHint: "git merge main",
        validate: (snapshot, command) => snapshot.commits.some((c) => c.parents.length > 1) && cmdIs("git merge")(command),
      },
      {
        id: "w3-rebase",
        title: "执行 rebase",
        instruction: "输入 git rebase main，体验指针重定位。",
        commandHint: "git rebase main",
        validate: (_snapshot, command) => cmdIs("git rebase")(command),
      },
    ],
  },
  {
    id: "world4",
    title: "World 4 - 远端",
    description: "学习 origin / fetch / push / pull。",
    mode: "sim",
    steps: [
      {
        id: "w4-remote",
        title: "添加远端",
        instruction: "输入 git remote add origin https://example.com/repo.git。",
        commandHint: "git remote add origin https://example.com/repo.git",
        validate: (snapshot, command) => snapshot.remotes.some((r) => r.name === "origin") && cmdIs("git remote add")(command),
      },
      {
        id: "w4-push",
        title: "推送远端",
        instruction: "输入 git push origin main，观察远端分支变化。",
        commandHint: "git push origin main",
        validate: (snapshot, command) =>
          snapshot.refs.some((r) => r.type === "remote" && r.name === "origin/main" && r.target) && cmdIs("git push")(command),
      },
    ],
  },
  {
    id: "world5",
    title: "World 5 - 真实沙盒",
    description: "切换到 Real 模式，体验浏览器内真实 git。",
    mode: "real",
    steps: [
      {
        id: "w5-init",
        title: "真实引擎初始化",
        instruction: "输入 git init，创建真实仓库。",
        commandHint: "git init",
        validate: (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
      },
      {
        id: "w5-commit",
        title: "真实提交",
        instruction: "输入 git add demo.txt 与 git commit -m \"real\"。",
        commandHint: "git add demo.txt",
        validate: (_snapshot, command) => cmdIs("git add")(command) || cmdIs("git commit")(command),
      },
    ],
  },
];

