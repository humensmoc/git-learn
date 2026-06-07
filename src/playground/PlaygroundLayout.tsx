import { useState, type ReactNode } from "react";
import { Allotment } from "allotment";

import { FilePanel } from "../components/FilePanel";
import { GitGraph } from "../components/GitGraph";
import { GitShortcutPanel } from "../components/GitShortcutPanel";
import { TerminalPanel } from "../components/TerminalPanel";
import { WindowChrome } from "../components/WindowChrome";
import type { RepoSnapshot } from "../engine/snapshot";

type PanelMode = "terminal" | "shortcuts";

interface PlaygroundLayoutProps {
  snapshot: RepoSnapshot;
  history: string[];
  onCommand: (command: string) => void | Promise<void>;
  getCompletions: (input: string) => string[];
  darkMode: boolean;
  rightOverlay?: ReactNode;
}

const PanelModeToggle = ({
  mode,
  onChange,
}: {
  mode: PanelMode;
  onChange: (mode: PanelMode) => void;
}) => (
  <div className="panel-mode-toggle">
    <button
      type="button"
      className={mode === "terminal" ? "is-active" : ""}
      onClick={() => onChange("terminal")}
    >
      终端
    </button>
    <button
      type="button"
      className={mode === "shortcuts" ? "is-active" : ""}
      onClick={() => onChange("shortcuts")}
    >
      快捷
    </button>
  </div>
);

export const PlaygroundLayout = ({
  snapshot,
  history,
  onCommand,
  getCompletions,
  darkMode,
  rightOverlay,
}: PlaygroundLayoutProps) => {
  const [panelMode, setPanelMode] = useState<PanelMode>("terminal");

  return (
    <Allotment className="split-root" proportionalLayout defaultSizes={[35, 65]}>
      <Allotment.Pane minSize={320}>
        <Allotment vertical className="left-split" defaultSizes={[62, 38]}>
          <Allotment.Pane minSize={160}>
            <WindowChrome
              title={panelMode === "terminal" ? "终端" : "Git 快捷"}
              variant="dark"
              rightSlot={<PanelModeToggle mode={panelMode} onChange={setPanelMode} />}
            >
              {panelMode === "terminal" ? (
                <TerminalPanel
                  history={history}
                  onCommand={onCommand}
                  getCompletions={getCompletions}
                  darkMode={darkMode}
                />
              ) : (
                <GitShortcutPanel onCommand={onCommand} />
              )}
            </WindowChrome>
          </Allotment.Pane>
          <Allotment.Pane minSize={120}>
            <WindowChrome title="文件状态">
              <FilePanel snapshot={snapshot} />
            </WindowChrome>
          </Allotment.Pane>
        </Allotment>
      </Allotment.Pane>
      <Allotment.Pane minSize={400}>
        <div className="graph-pane-shell">
          <WindowChrome title="Graph View" className="graph-window">
            <GitGraph snapshot={snapshot} />
          </WindowChrome>
          {rightOverlay}
        </div>
      </Allotment.Pane>
    </Allotment>
  );
};
