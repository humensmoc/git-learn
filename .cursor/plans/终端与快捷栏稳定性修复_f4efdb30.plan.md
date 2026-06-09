---
name: 终端与快捷栏稳定性修复
overview: 修复课程模式下远程按钮文案与识别问题、快捷栏开启后禁输入、长命令换行异常、快捷栏不可滚动、缺少 clone/fetch 快捷按钮、rebase 误用提示不清，以及 Real 模式 Buffer 报错。
todos:
  - id: enable-input-with-shortcut-open
    content: 快捷栏开启时保持终端可输入（移除输入禁用链路）
    status: completed
  - id: fix-multiline-prompt-render
    content: 修复 TerminalPanel 多行输入重绘，避免逐键新增空行
    status: completed
  - id: make-shortcut-dock-scrollable
    content: 调整快捷栏 CSS，使其在空间不足时支持滚动且不裁切内容
    status: completed
  - id: update-remote-copy-and-guidance
    content: 优化 remote add 文案与 origin 引导，减少识别失败
    status: completed
  - id: add-clone-fetch-shortcuts
    content: 在 shortcuts.ts 增加 clone 与 fetch 快捷按钮与子项
    status: completed
  - id: improve-rebase-error-messaging
    content: 在 simEngine.ts 增强 pull rebase / rebas 的定向提示
    status: completed
  - id: polyfill-buffer-for-real-mode
    content: 在浏览器入口注入 Buffer polyfill，修复 Real 模式报错
    status: completed
  - id: run-regression-validation
    content: 执行构建与相关交互回归验证
    status: completed
isProject: false
---

# 终端与快捷栏稳定性修复计划

## 修复目标
- 远程快捷文案和引导改成你要的 `add remote at origin` 语义（并减少输入后识别失败）。
- 打开快捷栏后仍可继续在终端手打命令。
- 修复长命令自动换行后“每打一个字母多一行”的输入重绘问题。
- 快捷栏支持滚动，避免小窗口下按钮被裁切。
- 快捷栏补齐 `clone` / `fetch`。
- 优化 `pull rebase` / `rebas` 类误输的报错引导。
- 修复 Real 模式 `Buffer is not defined`。

## 关键根因（已定位）
- 终端输入被禁用：[`src/components/TerminalShell.tsx`](src/components/TerminalShell.tsx) 传入 `inputEnabled={!shortcutOpen}`，并被 [`src/components/TerminalPanel.tsx`](src/components/TerminalPanel.tsx) 拦截。
- 快捷栏不可滚动：[`src/App.css`](src/App.css) 中 `.shortcut-dock.is-open` 固定 `max-height: 160px` 且内部无纵向滚动。
- 长命令换行残影：[`src/components/TerminalPanel.tsx`](src/components/TerminalPanel.tsx) 的 `renderPromptLine()` 只清一行，未清理自动换行产生的多行。
- clone/fetch 缺失：[`src/terminal/shortcuts.ts`](src/terminal/shortcuts.ts) 的 `gitShortcuts` 未定义。
- `remote rebase 不存在`：来自 [`src/engine/sim/simEngine.ts`](src/engine/sim/simEngine.ts) 对 `pull/fetch/push` 首参按远程名解析，误把 `rebase` 当 remote。
- Real Buffer 报错：[`src/engine/real/realEngine.ts`](src/engine/real/realEngine.ts) 调用 isomorphic-git 时浏览器缺少 `globalThis.Buffer`。

## 实施步骤
1. **修正快捷栏可输入行为**
- 在 [`src/components/TerminalShell.tsx`](src/components/TerminalShell.tsx) 保持 `TerminalPanel` 输入启用，不再因快捷栏打开而禁用输入。
- 回归测试：快捷栏开/关都可手打命令，快捷按钮仍可点击执行。

2. **修复终端长命令重绘（多行清理）**
- 在 [`src/components/TerminalPanel.tsx`](src/components/TerminalPanel.tsx) 改造 `renderPromptLine()`：
  - 记录上次输入占用的视觉行数；
  - 重绘前逐行向上清除（而非只清当前行）；
  - 重新定位光标到正确行列。
- 保留现有高亮逻辑 [`src/terminal/highlight.ts`](src/terminal/highlight.ts)，仅修正重绘策略。

3. **快捷栏滚动与裁切修复**
- 在 [`src/App.css`](src/App.css)：
  - `.shortcut-dock.is-open` 改为更合理高度上限（如 `max-height: 220px`）；
  - 给 `.shortcut-toolbar` 增加 `overflow-y: auto`；
  - 避免展开子项时被父容器不必要裁切。

4. **远程文案与输入引导优化**
- 在 [`src/terminal/shortcuts.ts`](src/terminal/shortcuts.ts)：
  - `remote` 的 add 子项文案改为更直观（例如 `add remote`）；
  - 默认 placeholder / 示例命令明确 `origin`（`origin https://...`）；
  - tooltip 场景说明同步更新，减少“输了但没识别”的误解。

5. **补齐 clone/fetch 快捷按钮**
- 在 [`src/terminal/shortcuts.ts`](src/terminal/shortcuts.ts) 新增：
  - `clone`（URL 输入）；
  - `fetch`（`fetch` / `fetch origin`）。
- 复用现有 `buildShortcutCommand()`，不改调用方结构。

6. **改进 rebase 误输报错提示（Sim 引擎）**
- 在 [`src/engine/sim/simEngine.ts`](src/engine/sim/simEngine.ts)：
  - 对 `git pull rebase`（无 `--`）给出定向提示：应使用 `git pull --rebase`；
  - 对 `git rebas` 维持无效子命令，但补一个“你是否想输入 git rebase”的提示文案（不改变严格匹配行为）。

7. **修复 Real 模式 Buffer 报错**
- 在 [`src/main.tsx`](src/main.tsx) 注入浏览器端 Buffer polyfill：`globalThis.Buffer = Buffer`。
- 必要时在依赖中补 `buffer`（若当前未直接可用）。
- 验证 Real 模式基础命令（init/add/commit/log）可正常执行。

8. **回归验证**
- 功能验证：
  - 快捷栏开时可手打；
  - 长命令输入不再逐键增行；
  - 快捷栏可滚动；
  - clone/fetch 按钮可执行；
  - `pull rebase` 提示更友好；
  - Real 不再出现 Buffer 报错。
- 工程验证：运行 `npm run build` 与 lints（涉及改动文件）。

## 风险与兼容
- 终端多行重绘是本次最容易引入回归的区域，优先保持现有快捷键/历史/补全行为不变。
- Sim 引擎报错文案增强应只在明显误用场景触发，避免误判正常命令。