import { useState, type ReactNode } from "react";
import { Allotment } from "allotment";

import { FilePanel } from "../components/FilePanel";
import { GitGraph } from "../components/GitGraph";
import { TerminalShell } from "../components/TerminalShell";
import { WindowChrome } from "../components/WindowChrome";
import type { RepoSnapshot } from "../engine/snapshot";
import type { EngineMode } from "../engine/types";
import type { CommandSource } from "../terminal/commandLog";

export interface CommandHandlerMeta {
  source?: CommandSource;
  shortcutId?: string;
}

interface PlaygroundLayoutProps {
  snapshot: RepoSnapshot;
  history: string[];
  engineMode: EngineMode;
  onCommand: (command: string, meta?: CommandHandlerMeta) => void | Promise<void>;
  getCompletions: (input: string) => string[];
  darkMode: boolean;
  rightOverlay?: ReactNode;
}

export const PlaygroundLayout = ({
  snapshot,
  history,
  engineMode,
  onCommand,
  getCompletions,
  darkMode,
  rightOverlay,
}: PlaygroundLayoutProps) => {
  const [shortcutOpen, setShortcutOpen] = useState(false);

  return (
    <Allotment className="split-root" proportionalLayout defaultSizes={[35, 65]}>
      <Allotment.Pane minSize={320}>
        <Allotment vertical className="left-split" defaultSizes={[62, 38]}>
          <Allotment.Pane minSize={160}>
            <WindowChrome
              title="终端"
              variant="dark"
              rightSlot={
                <button
                  type="button"
                  className={`shortcut-toggle${shortcutOpen ? " is-active" : ""}`}
                  onClick={() => setShortcutOpen((v) => !v)}
                >
                  快捷
                </button>
              }
            >
              <TerminalShell
                history={history}
                snapshot={snapshot}
                shortcutOpen={shortcutOpen}
                onCommand={(cmd, shortcutId) =>
                  onCommand(cmd, { source: shortcutId ? "shortcut" : "terminal", shortcutId })
                }
                getCompletions={getCompletions}
                darkMode={darkMode}
              />
            </WindowChrome>
          </Allotment.Pane>
          <Allotment.Pane minSize={120}>
            <WindowChrome title="文件状态">
              <FilePanel
                snapshot={snapshot}
                engineMode={engineMode}
                onCommand={(cmd, meta) => onCommand(cmd, meta)}
              />
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
