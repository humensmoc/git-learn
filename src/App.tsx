import { useEffect, useState } from "react";
import "allotment/dist/style.css";
import "./App.css";

import { useGitSession } from "./hooks/useGitSession";
import { LessonPage } from "./lesson/LessonPage";
import { PlaygroundPage } from "./playground/PlaygroundPage";

const THEME_KEY = "git-learn-theme";

type AppMode = "playground" | "lesson";

function App() {
  const session = useGitSession();
  const [appMode, setAppMode] = useState<AppMode>("playground");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") setDarkMode(true);
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Git 命令行教学网站</h1>
        </div>
        <div className="topbar-actions">
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
    </div>
  );
}

export default App;
