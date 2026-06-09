# Git Learn

<p align="center">
  <strong>Learn Git in the browser — terminal, graph, and guided lessons.</strong><br>
  <strong>在浏览器里学 Git —— 终端、可视化图谱与引导式关卡。</strong>
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#中文">中文</a>
</p>

---

## English

### Overview

**Git Learn** is an interactive web app for learning Git from the command line. Type real Git commands in a built-in terminal, watch the repository state update in real time, and progress through 15 scenario-driven lessons — from `git init` to remote collaboration, branching, stashing, and rollback.

The UI is inspired by tools like [Learn Git Branching](https://learngitbranching.js.org/) and [git-sim](https://github.com/initialcommit-com/git-sim), with a nerd-friendly aesthetic: monospace terminal, animated commit graph, and structured lesson panels.

### Features

- **Interactive terminal** — xterm.js-based shell with command history, tab completion, and built-in helpers (`hint`, `levels`, `reset`)
- **Live Git graph** — SVG visualization of commits, branches, tags, and remotes with smooth animations
- **File status panel** — working tree, staging area, and HEAD at a glance
- **15 scenario lessons** — progressive curriculum covering init, daily commits, diagnostics, remote sync, branching, merge/rebase, stash, undo, rollback, `.gitignore`, and a real-engine finale
- **Dual engine architecture**
  - **Sim mode** — lightweight simulated Git engine for fast, safe practice (most lessons)
  - **Real mode** — [isomorphic-git](https://isomorphic-git.org/) runs a real Git repository entirely in the browser (S15 finale)
- **Lesson validation** — each step checks your command and repo state before advancing
- **Progress persistence** — lesson progress and theme preference saved to `localStorage`
- **Dark mode** — toggle light / dark theme
- **Sound feedback** — optional key-tick sound on command input

### Quick Start

**Requirements:** Node.js 18+ and npm

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/git-learn.git
cd git-learn

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Lesson Worlds

| # | Topic | Engine |
|---|-------|--------|
| 1 | S01 Local new project | Sim |
| 2 | S02 Daily commit workflow | Sim |
| 3 | S03 Status diagnostics | Sim |
| 4 | S04 First push to GitHub | Sim |
| 5 | S05 Clone & sync on new device | Sim |
| 6 | S06 Change remote URL | Sim |
| 7 | S07 Feature branching | Sim |
| 8 | S08 Merge or rebase | Sim |
| 9 | S09 Sync teammate updates | Sim |
| 10 | S10 Pre-PR history cleanup | Sim |
| 11 | S11 Stash interrupted work | Sim |
| 12 | S12 Undo before push | Sim |
| 13 | S13 Safe rollback after push | Sim |
| 14 | S14 Ignore unwanted files | Sim |
| 15 | S15 Real sandbox drill | Real |

### Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [xterm.js](https://xtermjs.org/) — terminal UI
- [isomorphic-git](https://isomorphic-git.org/) + [@isomorphic-git/lightning-fs](https://github.com/isomorphic-git/lightning-fs) — in-browser Git (Real mode)
- [Framer Motion](https://www.framer.com/motion/) — graph animations
- [Allotment](https://github.com/johnwalley/allotment) — resizable split panes

### Project Structure

```
src/
├── components/     # UI panels (terminal, graph, lessons, files, goals)
├── engine/         # Git engine layer (SimEngine, RealEngine, Router)
├── lessons/        # Lesson definitions and step validators
└── viz/            # Graph layout and animation helpers
```

### Architecture Notes

The app follows a three-layer design (see `docs/先沙盒后教程-架构与迁移.md` for details):

1. **Git Runtime** — command execution and `RepoSnapshot` state
2. **Playground Shell** — terminal, graph, and file panels
3. **Lesson Layer** — guided steps, hints, and progress tracking

The long-term goal is a standalone Git sandbox with pluggable lessons on top.

### Acknowledgements

Inspired by and built with ideas from:

- [Learn Git Branching](https://learngitbranching.js.org/)
- [git-sim](https://github.com/initialcommit-com/git-sim)
- [Visualizing Git](https://git-school.github.io/visualizing-git/)
- [Oh My Git!](https://ohmygit.org/)

---

## 中文

### 项目简介

**Git Learn** 是一个在浏览器中学习的 Git 命令行教学网站。在内置终端里输入真实的 Git 命令，右侧图谱与文件面板会实时反映仓库变化，并通过 15 个场景化关卡，从 `git init` 一路练到远程协作、分支、暂存与回滚。

界面参考了 [Learn Git Branching](https://learngitbranching.js.org/) 与 [git-sim](https://github.com/initialcommit-com/git-sim) 的交互形态，整体走偏极客、规整的风格：等宽终端、动画化提交图谱、结构化教学面板。

### 功能亮点

- **交互式终端** — 基于 xterm.js，支持命令历史、Tab 补全，以及内置辅助命令（`hint`、`levels`、`reset`）
- **实时 Git 图谱** — SVG 展示提交、分支、标签与远程，带动画过渡
- **文件状态面板** — 工作区、暂存区与 HEAD 一目了然
- **15 个场景化关卡** — 覆盖初始化、日常提交、状态诊断、远程同步、分支、合并/变基、stash、撤销、安全回滚、`.gitignore`，以及真实引擎收官
- **双引擎架构**
  - **Sim 模式** — 轻量模拟引擎，适合快速、安全地练习（大部分关卡）
  - **Real 模式** — 基于 [isomorphic-git](https://isomorphic-git.org/)，在浏览器内运行真实 Git 仓库（S15）
- **步骤校验** — 每步会检查命令与仓库状态，通过后才进入下一步
- **进度保存** — 关卡进度与主题偏好写入 `localStorage`
- **夜间模式** — 支持明暗主题切换
- **音效反馈** — 输入命令时可播放短促按键音（可关闭）

### 快速开始

**环境要求：** Node.js 18+ 与 npm

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/git-learn.git
cd git-learn

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在终端中打开显示的地址（通常为 `http://localhost:5173`）。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（支持热更新） |
| `npm run build` | 类型检查并构建生产版本 |
| `npm run preview` | 本地预览生产构建 |
| `npm run lint` | 运行 ESLint |

### 关卡一览

| 序号 | 场景 | 引擎 |
|------|------|------|
| 1 | S01 本地新项目 | Sim |
| 2 | S02 日常改动提交 | Sim |
| 3 | S03 诊断状态差异 | Sim |
| 4 | S04 第一次推 GitHub | Sim |
| 5 | S05 换电脑克隆同步 | Sim |
| 6 | S06 更换远程地址 | Sim |
| 7 | S07 开分支做功能 | Sim |
| 8 | S08 合并或变基 | Sim |
| 9 | S09 拉队友最新代码 | Sim |
| 10 | S10 PR 前整理历史 | Sim |
| 11 | S11 被打断暂存现场 | Sim |
| 12 | S12 撤销还没推送的改动 | Sim |
| 13 | S13 已推送后的安全回滚 | Sim |
| 14 | S14 忽略不该提交的文件 | Sim |
| 15 | S15 真实环境演练 | Real |

### 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [xterm.js](https://xtermjs.org/) — 终端界面
- [isomorphic-git](https://isomorphic-git.org/) + [@isomorphic-git/lightning-fs](https://github.com/isomorphic-git/lightning-fs) — 浏览器内 Git（Real 模式）
- [Framer Motion](https://www.framer.com/motion/) — 图谱动画
- [Allotment](https://github.com/johnwalley/allotment) — 可拖拽分栏布局

### 目录结构

```
src/
├── components/     # UI 面板（终端、图谱、课程、文件、目标）
├── engine/         # Git 引擎层（SimEngine、RealEngine、Router）
├── lessons/        # 关卡定义与步骤校验逻辑
└── viz/            # 图谱布局与动画辅助
```

### 架构说明

项目采用三层架构（详见 `docs/先沙盒后教程-架构与迁移.md`）：

1. **Git Runtime** — 命令执行与 `RepoSnapshot` 仓库状态
2. **Playground Shell** — 终端、图谱、文件面板等沙盒界面
3. **Lesson Layer** — 引导步骤、提示与进度管理

长期目标是：先做成可独立使用的 Git 沙盒，再在其上叠加可插拔的教程层。

### 致谢

本项目受到以下工具与项目的启发：

- [Learn Git Branching](https://learngitbranching.js.org/)
- [git-sim](https://github.com/initialcommit-com/git-sim)
- [Visualizing Git](https://git-school.github.io/visualizing-git/)
- [Oh My Git!](https://ohmygit.org/)
