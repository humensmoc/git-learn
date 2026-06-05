import { useEffect, useMemo, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import "./App.css";

import { FilePanel } from "./components/FilePanel";
import { GitGraph } from "./components/GitGraph";
import { LessonPanel } from "./components/LessonPanel";
import { TerminalPanel } from "./components/TerminalPanel";
import { EngineRouter } from "./engine/router";
import type { RepoSnapshot } from "./engine/snapshot";
import type { EngineMode } from "./engine/types";
import { worlds } from "./lessons/data";

const router = new EngineRouter();
const STORAGE_KEY = "git-learn-progress";

function App() {
  const [worldIndex, setWorldIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<RepoSnapshot>(router.getSnapshot());
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentWorld = worlds[worldIndex];
  const currentStep = currentWorld.steps[stepIndex];

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ worldIndex, stepIndex }));
  }, [stepIndex, worldIndex]);

  useEffect(() => {
    const mode = currentWorld.mode as EngineMode;
    router.setMode(mode);
    router.reset().then(setSnapshot);
    setTerminalHistory([`已切换到 ${currentWorld.title} (${mode.toUpperCase()} 模式)`]);
    setStepIndex(0);
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

  const onCommand = async (command: string) => {
    playTick();
    if (command === "levels") {
      setTerminalHistory((prev) => [...prev, ...worlds.map((w, i) => `${i + 1}. ${w.title}`)]);
      return;
    }
    if (command === "hint") {
      setTerminalHistory((prev) => [...prev, `提示: ${currentStep.commandHint}`]);
      return;
    }
    if (command === "reset") {
      const next = await router.reset();
      setSnapshot(next);
      setStepIndex(0);
      setTerminalHistory((prev) => [...prev, "仓库已重置。"]);
      return;
    }

    const result = await router.execute(command);
    setSnapshot(result.snapshot);
    setTerminalHistory((prev) => [...prev, `> ${command}`, ...result.output]);
    if (currentStep.validate(result.snapshot, command)) {
      setStepIndex((idx) => Math.min(idx + 1, currentWorld.steps.length - 1));
      setTerminalHistory((prev) => [...prev, "✅ 本步骤完成"]);
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
          <button type="button" onClick={() => setWorldIndex((i) => Math.max(0, i - 1))}>
            上一关
          </button>
          <button type="button" onClick={() => setWorldIndex((i) => Math.min(worlds.length - 1, i + 1))}>
            下一关
          </button>
          <button type="button" onClick={() => setSoundEnabled((v) => !v)}>
            音效: {soundEnabled ? "开" : "关"}
          </button>
        </div>
      </header>
      <main className="main-layout">
        <Allotment className="split-root" proportionalLayout defaultSizes={[35, 65]}>
          <Allotment.Pane minSize={360}>
            <div className="left-stack">
              <LessonPanel
                world={currentWorld}
                worldIndex={worldIndex}
                totalWorlds={worlds.length}
                stepIndex={stepIndex}
                onSelectWorld={setWorldIndex}
              />
              <TerminalPanel history={terminalHistory} onCommand={onCommand} getCompletions={completionFn} />
              <FilePanel snapshot={snapshot} />
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={500}>
            <GitGraph snapshot={snapshot} />
          </Allotment.Pane>
        </Allotment>
      </main>
    </div>
  );
}

export default App;
