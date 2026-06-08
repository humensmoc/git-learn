import { useMemo, useState, type CSSProperties } from "react";

import type { RepoSnapshot } from "../engine/snapshot";
import { getLocalBranchNames, getTrackedFileNames } from "../terminal/snapshotHelpers";
import { buildShortcutCommand, gitShortcuts, type GitShortcut, type ShortcutOption } from "../terminal/shortcuts";
import { ParamPickerDialog } from "./ParamPickerDialog";

interface ShortcutDockProps {
  open: boolean;
  snapshot: RepoSnapshot;
  onCommand: (command: string, shortcutId?: string) => void | Promise<void>;
}

export const ShortcutDock = ({ open, snapshot, onCommand }: ShortcutDockProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    shortcut: GitShortcut;
    option: ShortcutOption;
  } | null>(null);

  const quickPicks = useMemo(() => {
    if (!pending?.option.input?.picker) return [];
    if (pending.option.input.picker === "branch") return getLocalBranchNames(snapshot);
    if (pending.option.input.picker === "file") return getTrackedFileNames(snapshot);
    return [];
  }, [pending, snapshot]);

  const runShortcut = (shortcut: GitShortcut, option?: ShortcutOption, inputValue?: string) => {
    const cmd = buildShortcutCommand(shortcut, option, inputValue);
    void onCommand(cmd, shortcut.id);
    setExpandedId(null);
  };

  const handleMainClick = (shortcut: GitShortcut) => {
    if (!shortcut.options?.length) {
      runShortcut(shortcut);
      return;
    }
    setExpandedId((prev) => (prev === shortcut.id ? null : shortcut.id));
  };

  const handleOptionClick = (shortcut: GitShortcut, option: ShortcutOption) => {
    if (option.input) {
      setPending({ shortcut, option });
      return;
    }
    runShortcut(shortcut, option);
  };

  return (
    <div className={`shortcut-dock${open ? " is-open" : ""}`}>
      <div className="shortcut-toolbar">
        {gitShortcuts.map((shortcut) => {
          const isExpanded = expandedId === shortcut.id;
          return (
            <div
              key={shortcut.id}
              className={`shortcut-pill shortcut-pill--${shortcut.id}${isExpanded ? " is-expanded" : ""}`}
            >
              <button type="button" className="pill-main" onClick={() => handleMainClick(shortcut)}>
                {shortcut.label}
              </button>
              {shortcut.options ? (
                <div className="pill-options" aria-hidden={!isExpanded}>
                  {shortcut.options.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      className="pill-sub"
                      style={{ "--delay": index } as CSSProperties}
                      onClick={() => handleOptionClick(shortcut, option)}
                      tabIndex={isExpanded ? 0 : -1}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <ParamPickerDialog
        open={pending !== null}
        title="输入参数"
        placeholder={pending?.option.input?.placeholder ?? ""}
        quickPicks={quickPicks}
        quickPickLabel={pending?.option.input?.picker === "branch" ? "当前分支" : "常用文件"}
        onCancel={() => setPending(null)}
        onConfirm={(value) => {
          if (!pending) return;
          runShortcut(pending.shortcut, pending.option, value);
          setPending(null);
        }}
      />
    </div>
  );
};
