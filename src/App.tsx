import { useEffect, useMemo, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import "./App.css";

import { FilePanel } from "./components/FilePanel";
import { GitGraph } from "./components/GitGraph";
import { GoalPanel } from "./components/GoalPanel";
import { LessonPanel } from "./components/LessonPanel";
import { TerminalPanel } from "./components/TerminalPanel";
import { WindowChrome } from "./components/WindowChrome";
import { EngineRouter } from "./engine/router";
import type { RepoSnapshot } from "./engine/snapshot";
import type { EngineMode } from "./engine/types";
import { worlds } from "./lessons/data";

const router = new EngineRouter();
const STORAGE_KEY = "git-learn-progress";
const THEME_KEY = "git-learn-theme";

function App() {
  const [worldIndex, setWorldIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<RepoSnapshot>(router.getSnapshot());
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [lessonFeedback, setLessonFeedback] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [goalVisible, setGoalVisible] = useState(true);

  const currentWorld = worlds[worldIndex];
  const activeStepIndex = Math.min(stepIndex, currentWorld.steps.length - 1);
  const currentStep = currentWorld.steps[activeStepIndex];

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { worldIndex: number; stepIndex: number };
      setWorldIndex(Math.min(worlds.length - 1, Math.max(0, parsed.worldIndex)));
      setStepIndex(Math.max(0, parsed.stepIndex));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ worldIndex, stepIndex }));
  }, [stepIndex, worldIndex]);

  const selectWorld = (index: number) => {
    const next = Math.min(worlds.length - 1, Math.max(0, index));
    if (next === worldIndex) return;
    setStepIndex(0);
    setWorldIndex(next);
  };

  useEffect(() => {
    const mode = currentWorld.mode as EngineMode;
    router.setMode(mode);
    router.reset().then(setSnapshot);
    setTerminalHistory((prev) => [
      ...prev,
      `----- 进入 ${currentWorld.title} (${mode.toUpperCase()}) -----`,
    ]);
    const intro = [`已进入 ${currentWorld.title}，请按提示输入命令。`];
    if (currentWorld.steps[0]?.riskNote) {
      intro.push(`安全提示：${currentWorld.steps[0].riskNote}`);
    }
    setLessonFeedback(intro);
  }, [worldIndex]);

  const playTick = () => {
    if (!soundEnabled) return;
    const audioContext = new window.AudioContext();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.value = 580;
    gain.gain.value = 0.025;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.06);
  };

  const showHint = () => {
    const lines = [`提示：${currentStep.commandHint}`];
    if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
    setLessonFeedback(lines);
  };

  const onCommand = async (command: string) => {
    playTick();
    if (command === "levels") {
      setLessonFeedback([
        "关卡列表：",
        ...worlds.map((w, i) => `${i + 1}. ${w.title}`),
      ]);
      return;
    }
    if (command === "hint") {
      showHint();
      return;
    }
    if (command === "reset") {
      const next = await router.reset();
      setSnapshot(next);
      setStepIndex(0);
      setLessonFeedback(["仓库已重置，请从当前步骤重新输入命令。"]);
      return;
    }

    const result = await router.execute(command);
    setSnapshot(result.snapshot);
    setTerminalHistory((prev) => [...prev, `$ ${command}`, ...result.output]);
    if (currentStep.validate(result.snapshot, command)) {
      const nextIndex = Math.min(activeStepIndex + 1, currentWorld.steps.length - 1);
      setStepIndex(nextIndex);
      const nextStep = currentWorld.steps[nextIndex];
      if (nextStep?.riskNote && nextIndex !== activeStepIndex) {
        setLessonFeedback(["当前步骤已完成，继续下一步。", `安全提示：${nextStep.riskNote}`]);
      } else {
        setLessonFeedback(["当前步骤已完成，继续下一步。"]);
      }
    } else if (result.output.length) {
      const lines = ["继续根据当前步骤提示输入命令。"];
      if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
      setLessonFeedback(lines);
    }
  };

  const completionFn = useMemo(() => (input: string) => {
    const builtin = ["levels", "hint", "reset"].filter((item) => item.startsWith(input.trim()));
    return [...builtin, ...router.getCompletions(input)];
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Git 命令行教学网站</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => selectWorld(worldIndex - 1)}>
            上一关
          </button>
          <button type="button" onClick={() => selectWorld(worldIndex + 1)}>
            下一关
          </button>
          <button type="button" onClick={() => setSoundEnabled((v) => !v)}>
            音效: {soundEnabled ? "开" : "关"}
          </button>
          <button type="button" onClick={() => setDarkMode((v) => !v)}>
            夜间模式: {darkMode ? "开" : "关"}
          </button>
        </div>
      </header>
      <main className="main-layout">
        <Allotment className="split-root" proportionalLayout defaultSizes={[35, 65]}>
          <Allotment.Pane minSize={360}>
            <div className="left-stack">
              <WindowChrome title="学习 Git 分支" className="lesson-window">
                <LessonPanel
                  world={currentWorld}
                  worldIndex={worldIndex}
                  totalWorlds={worlds.length}
                  stepIndex={activeStepIndex}
                  onSelectWorld={selectWorld}
                  onHint={showHint}
                  onToggleGoal={() => setGoalVisible((v) => !v)}
                  goalVisible={goalVisible}
                  feedback={lessonFeedback}
                />
              </WindowChrome>
              <WindowChrome title="终端" variant="dark">
                <TerminalPanel
                  history={terminalHistory}
                  onCommand={onCommand}
                  getCompletions={completionFn}
                  darkMode={darkMode}
                />
              </WindowChrome>
              <WindowChrome title="文件状态">
                <FilePanel snapshot={snapshot} />
              </WindowChrome>
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={500}>
            <div className="graph-pane-shell">
              <WindowChrome title="Graph View" className="graph-window">
                <GitGraph snapshot={snapshot} />
              </WindowChrome>
              {goalVisible ? <GoalPanel step={currentStep} /> : null}
            </div>
          </Allotment.Pane>
        </Allotment>
      </main>
    </div>
  );
}

export default App;
