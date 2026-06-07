import { TerminalPanel } from "./TerminalPanel";
import { ShortcutDock } from "./ShortcutDock";
import type { RepoSnapshot } from "../engine/snapshot";

interface TerminalShellProps {
  history: string[];
  snapshot: RepoSnapshot;
  shortcutOpen: boolean;
  onCommand: (command: string, shortcutId?: string) => void | Promise<void>;
  getCompletions: (input: string) => string[];
  darkMode: boolean;
}

export const TerminalShell = ({
  history,
  snapshot,
  shortcutOpen,
  onCommand,
  getCompletions,
  darkMode,
}: TerminalShellProps) => (
  <div className={`terminal-shell${shortcutOpen ? " shortcut-open" : ""}`}>
    <TerminalPanel
      history={history}
      onCommand={(cmd) => onCommand(cmd)}
      getCompletions={getCompletions}
      darkMode={darkMode}
      inputEnabled={!shortcutOpen}
    />
    <ShortcutDock open={shortcutOpen} snapshot={snapshot} onCommand={onCommand} />
  </div>
);
