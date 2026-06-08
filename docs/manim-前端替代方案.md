# Manim 与前端动画替代方案

> 整理自技术调研，用于评估「流畅的程序化动画」在浏览器端的实现路径。  
> 与本项目（Git 命令行教学网站）相关的选型建议见文末。

---

## 一、原版 Manim 能否在前端运行？

**结论：不能原生在前端运行。**

3Blue1Brown 使用的 **Manim（Python）** 是典型的**离线渲染**框架，而非网页运行时：

| 特点 | 说明 |
|------|------|
| 运行环境 | Python + Cairo / OpenGL + FFmpeg |
| 数学公式 | 通常需要完整 LaTeX 环境（体积可达数 GB） |
| 输出形式 | 渲染为 **MP4 / GIF** 等视频文件，再嵌入网页播放 |
| 交互性 | 默认无交互；用户只能观看预渲染内容 |

因此，它**无法**像普通前端库那样在浏览器里实时执行 Python 代码并出画。

### 常见折中方案

1. **预渲染 + 播放**：本地或服务器用 Manim 生成视频，前端用 `<video>` 播放。
2. **manim-slides**：将已渲染的 Manim 场景片段做成可翻页的网页演示（[jeertmans/manim-slides](https://github.com/jeertmans/manim-slides)），本质仍是预渲染，不是实时引擎。
3. **Pyodide 跑 Python Manim**：理论上可在浏览器跑 Python，但首次加载体积大（约 10MB+）、冷启动慢、文字渲染受限，不适合需要频繁状态更新的交互场景。

---

## 二、前端替代方案总览

按「与 Manim 风格接近程度」和「适用场景」分类如下。

| 方案 | 类型 | 浏览器实时 | Manim 风格 | 交互性 | 维护活跃度 |
|------|------|:----------:|:----------:|:------:|:----------:|
| [manim-web](#31-manim-web) | Manim TS 移植 | ✅ | ⭐⭐⭐⭐⭐ | 高 | 活跃（2026） |
| [manim-ts](#32-manim-ts) | Manim TS 移植 | ✅ | ⭐⭐⭐⭐⭐ | 高 | 活跃 |
| [DefinedMotion](#33-definedmotion) | 程序化动画引擎 | ✅ | ⭐⭐⭐⭐ | 中 | 较新 |
| [Motion Canvas](#34-motion-canvas) | 程序化动画引擎 | ✅ | ⭐⭐⭐⭐ | 中 | 维护放缓 |
| [Vivid](#35-vivid) | 数学可视化库 | ✅ | ⭐⭐⭐ | 高 | 较新 |
| [Anima](#36-anima) | 数学可视化库 | ✅ | ⭐⭐⭐ | 中 | 较新 |
| [GSAP + SVG/Canvas](#37-gsap--svgcanvas) | 通用动画栈 | ✅ | ⭐⭐ | 高 | 成熟稳定 |
| [D3.js](#38-d3js) | 数据可视化 | ✅ | ⭐ | 高 | 成熟稳定 |

---

## 三、各方案详解

### 3.1 manim-web

- **仓库**：[maloyan/manim-web](https://github.com/maloyan/manim-web)
- **文档**：[maloyan.github.io/manim-web](https://maloyan.github.io/manim-web/)
- **定位**：将 3Blue1Brown 的 Manim API 移植到 TypeScript，在浏览器中用 WebGL（Three.js）+ KaTeX 实时渲染。

**特点：**

- 零安装：无需 Python、FFmpeg、LaTeX
- API 与 Python Manim 高度相似（`Scene`、`play`、`Transform` 等）
- 支持几何图形、坐标系、函数图像、LaTeX 公式、3D 场景
- 提供 React / Vue 组件，可直接嵌入页面
- 支持 GIF / 视频导出
- 附带 Python → TypeScript 转换工具

**快速示例：**

```typescript
import { Scene, Circle, Square, Create, Transform, FadeOut } from 'manim-web';

async function squareToCircle(scene: Scene) {
  const square = new Square({ sideLength: 3 });
  const circle = new Circle({ radius: 1.5 });

  await scene.play(new Create(square));
  await scene.play(new Transform(square, circle));
  await scene.play(new FadeOut(square));
}
```

**适合：** 需要在浏览器里做 3b1b 风格的数理推导、公式变形、函数图像等教学内容。

---

### 3.2 manim-ts

- **仓库**：[melland55/Manim-ts](https://github.com/melland55/Manim-ts)
- **定位**：强调与 Python Manim 画面一致性的 TypeScript 移植版。

**特点：**

- 浏览器端可交互播放（时间轴拖拽、暂停、倍速）
- Node.js 端支持无头渲染与视频导出（基于 node-canvas / Cairo）
- 提供与 Python 版的 parity 测试套件
- 支持 React / Vue 封装组件

**适合：** 既要网页实时演示，又需要后期导出 MP4 做课程视频的场景。

---

### 3.3 DefinedMotion

- **仓库**：[HugoOlsson/DefinedMotion](https://github.com/HugoOlsson/DefinedMotion)
- **定位**：类似 Manim / Motion Canvas 的程序化动画库，基于 Three.js 生态。

**特点：**

- 强调开发体验：保存即热重载预览
- 完整 Three.js 能力：PBR 材质、光照、后处理等
- LaTeX → SVG → 3D，支持公式子串定位（便于做高亮、箭头标注）
- 2D 与 3D 均支持

**适合：** 复杂 3D 技术可视化、物理 / CS 演示，以及需要 Three.js 原生工作流的场景。

---

### 3.4 Motion Canvas

- **官网**：[motioncanvas.io](https://motioncanvas.io/)
- **定位**：TypeScript 编写的程序化动画框架，用生成器函数描述时间轴。

**特点：**

- 2D Canvas 渲染，内置时间轴编辑器
- 对 LaTeX、代码块、布局有良好支持
- 适合「讲解 + 音画同步」类视频制作

**注意：** 社区反馈其维护节奏在 2024 年底后有所放缓，新项目需评估活跃度，或优先考虑 manim-web / DefinedMotion。

**适合：** 2D 讲解类动画、带时间轴编辑的工作流。

---

### 3.5 Vivid

- **仓库**：[markm39/vivid](https://github.com/markm39/vivid)
- **定位**：浏览器内实时 Canvas 数学可视化库，Manim 启发式设计。

**特点：**

- 实时 Canvas 渲染，无需视频编码
- TypeScript 优先，API 偏声明式
- 内置函数、方程、矩阵、3D 坐标系支持
- 强调 AI 友好（便于由 LLM 生成动画代码）

**适合：** 轻量级数学演示、需要快速原型验证的场景。

---

### 3.6 Anima

- **仓库**：[RedWilly/Anima](https://github.com/RedWilly/Anima)
- **定位**：TypeScript 动画引擎，链式 API，基于 Canvas。

**特点：**

- 流畅的方法链写法
- 30+ 缓动函数（含 Manim 风格）
- 关键帧动画、相机系统（缩放、平移、跟随）
- 多格式导出：MP4、WebP、GIF、精灵图、PNG 序列
- 可在 Bun / Node / 浏览器运行

**适合：** 需要精细关键帧控制、多格式导出的几何 / 图形动画。

---

### 3.7 GSAP + SVG/Canvas

- **官网**：[gsap.com](https://gsap.com/)
- **定位**：业界成熟的 Web 动画库，不绑定特定领域。

**特点：**

- 动画极其丝滑，时间轴控制精细
- 与 SVG、Canvas、DOM 均可配合
- 生态成熟，文档与案例丰富
- 需自行实现「场景对象模型」和「状态 → 画面」映射

**适合：** 有明确状态机的交互式可视化（如 Git 图、流程图、UI 动效），自由度最高。

---

### 3.8 D3.js

- **官网**：[d3js.org](https://d3js.org/)
- **定位**：数据驱动文档，擅长图形布局与过渡。

**特点：**

- 力导向图、树形图、DAG 布局等开箱即用
- `transition()` 可做平滑属性插值
- 偏数据可视化，非教学动画引擎
- 复杂叙事性动画需较多手工编排

**适合：** Git 提交图、分支 DAG、网络拓扑等「图结构 + 增量更新」场景。

---

## 四、方案对比（能力维度）

| 能力 | manim-web | manim-ts | DefinedMotion | Motion Canvas | GSAP + SVG | D3.js |
|------|:---------:|:--------:|:-------------:|:-------------:|:----------:|:-----:|
| LaTeX 公式 | ✅ | ✅ | ✅ | ✅ | 需自行集成 | 需自行集成 |
| 函数图像 / 坐标系 | ✅ | ✅ | ✅ | ✅ | 需自行实现 | 部分支持 |
| 3D 场景 | ✅ | ✅ | ✅ 强 | 弱 | 需 Three.js | ❌ |
| 状态驱动增量更新 | 弱 | 弱 | 中 | 弱 | ✅ 强 | ✅ 强 |
| 视频导出 | ✅ | ✅ 强 | 部分 | ✅ | 需额外方案 | ❌ |
| 上手成本 | 低（熟悉 Manim 更低） | 低 | 中 | 中 | 中 | 中 |
| 包体积 / 加载 | 中 | 中 | 较大 | 中 | 小 | 小 |

---

## 五、与本项目（git-learn）的选型建议

本项目目标是：**终端输入 Git 命令 → 右侧可视化区域即时、平滑地反映仓库状态变化**，参考 Learn Git Branching 的交互流程与 git-sim 的视觉质感。

### 5.1 为什么不直接用 Manim 系方案？

| 方案 | 可行性 | 主要问题 |
|------|--------|----------|
| ManimCE + Pyodide | 技术上可行 | 首次加载大、冷启动慢、每次命令需重建 Scene，交互延迟明显 |
| manim-web（TS 版） | 浏览器可运行 | API 面向「预设剧本」式数学讲解，不适合状态机驱动的 Git 图增量更新 |
| git-sim 原版 | 视觉效果好 | Python CLI 离线工具，非网页；每次出图需等待数秒 |

Manim 擅长的是「一镜到底的预设动画」；本项目需要的是「命令 → 状态变更 → 局部动画」，属于**状态机 + 增量动画**问题。

### 5.2 推荐技术栈

```
Vite + React + TypeScript
├── 终端：xterm.js
├── Git 引擎：SimEngine（基础课）/ isomorphic-git（沙盒）
└── 可视化：SVG Git 图 + Motion（或 GSAP）增量动画
```

- **DAG 布局**：参考 D3 的层次布局思路，或自研轻量布局算法
- **动画**：Motion（`motion/react`）或 GSAP，控制 commit 节点、分支指针、HEAD 的 enter/update/exit
- **视觉 token**：对齐 git-sim 的配色与形状规范，而非直接依赖 Manim 渲染管线

### 5.3 若未来需要「数理推导」章节

可在特定课程模块中**局部嵌入** manim-web 组件，用于讲解底层概念（如 SHA-1 哈希、有向无环图性质等），但不作为全局可视化引擎。

---

## 六、参考链接

| 名称 | 链接 |
|------|------|
| Manim（Python 原版） | https://github.com/3b1b/manim |
| Manim Community Edition | https://github.com/ManimCommunity/manim |
| manim-web | https://github.com/maloyan/manim-web |
| manim-ts | https://github.com/melland55/Manim-ts |
| DefinedMotion | https://github.com/HugoOlsson/DefinedMotion |
| Motion Canvas | https://motioncanvas.io/ |
| Vivid | https://github.com/markm39/vivid |
| Anima | https://github.com/RedWilly/Anima |
| GSAP | https://gsap.com/ |
| D3.js | https://d3js.org/ |
| Learn Git Branching（交互参考） | https://learngitbranching.js.org/?locale=zh_CN |
| git-sim（视觉参考） | https://github.com/initialcommit-com/git-sim |

---

*文档版本：2026-06-06*
