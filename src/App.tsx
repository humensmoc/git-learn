import { useCallback, useEffect, useState } from "react";
import "allotment/dist/style.css";
import "./App.css";

import { HelpDialog } from "./components/HelpDialog";
import { useCommandDemo } from "./hooks/useCommandDemo";
import { useGitSession } from "./hooks/useGitSession";
import type { EngineMode } from "./engine/types";
import { LessonPage } from "./lesson/LessonPage";
import { PlaygroundPage } from "./playground/PlaygroundPage";

const THEME_KEY = "git-learn-theme";

type AppMode = "playground" | "lesson";

function App() {
  const session = useGitSession();
  const { isRunning, runDemo } = useCommandDemo(session);
  const [appMode, setAppMode] = useState<AppMode>("playground");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light") setDarkMode(false);
    else if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

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

  const handleResetRepo = useCallback(() => {
    void session.resetRepo().then(() => session.appendHistory(["仓库已重置。"]));
  }, [session]);

  const handleToggleEngine = useCallback(async () => {
    const next: EngineMode = session.mode === "sim" ? "real" : "sim";
    session.setMode(next);
    await session.resetRepo();
    session.appendHistory([`----- 引擎切换为 ${next.toUpperCase()} -----`]);
  }, [session]);

  return (
    <div className="app-shell">
      <header className="app-toolbar">
        <div className="app-toolbar-left">
          {appMode === "playground" ? (
            <>
              <button type="button" onClick={handleResetRepo}>
                重置仓库
              </button>
              <button type="button" onClick={() => void handleToggleEngine()}>
                引擎: {session.mode.toUpperCase()}
              </button>
            </>
          ) : null}
        </div>
        <div className="app-toolbar-actions">
          <button type="button" onClick={() => setHelpOpen(true)}>
            使用说明
          </button>
          <button
            type="button"
            className={appMode === "playground" ? "mode-active" : ""}
            onClick={() => setAppMode("playground")}
          >
            自由沙盒
          </button>
          <button
            type="button"
            className={appMode === "lesson" ? "mode-active" : ""}
            onClick={() => setAppMode("lesson")}
          >
            课程模式
          </button>
          <button type="button" onClick={() => void runDemo()} disabled={isRunning}>
            {isRunning ? "测试中…" : "测试"}
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
        {appMode === "playground" ? (
          <PlaygroundPage session={session} darkMode={darkMode} onPlayTick={playTick} />
        ) : (
          <LessonPage session={session} darkMode={darkMode} onPlayTick={playTick} />
        )}
      </main>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
