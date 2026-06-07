import { useState } from "react";

import { buildShortcutCommand, gitShortcuts, type GitShortcut, type ShortcutOption } from "../terminal/shortcuts";
import { TextInputDialog } from "./TextInputDialog";

interface GitShortcutPanelProps {
  onCommand: (command: string) => void | Promise<void>;
}

export const GitShortcutPanel = ({ onCommand }: GitShortcutPanelProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    shortcut: GitShortcut;
    option: ShortcutOption;
  } | null>(null);

  const runShortcut = (shortcut: GitShortcut, option?: ShortcutOption, inputValue?: string) => {
    const cmd = buildShortcutCommand(shortcut, option, inputValue);
    void onCommand(cmd);
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
    <section className="git-shortcut-panel">
      <div className="git-shortcut-grid">
        {gitShortcuts.map((shortcut) => (
          <div key={shortcut.id} className={`git-shortcut-item${expandedId === shortcut.id ? " is-expanded" : ""}`}>
            <button type="button" className="git-shortcut-main" onClick={() => handleMainClick(shortcut)}>
              {shortcut.label}
            </button>
            {expandedId === shortcut.id && shortcut.options ? (
              <div className="git-shortcut-options">
                {shortcut.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="shortcut-chip"
                    onClick={() => handleOptionClick(shortcut, option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <TextInputDialog
        open={pending !== null}
        title="输入参数"
        placeholder={pending?.option.input?.placeholder ?? ""}
        onCancel={() => setPending(null)}
        onConfirm={(value) => {
          if (!pending) return;
          runShortcut(pending.shortcut, pending.option, value);
          setPending(null);
        }}
      />
    </section>
  );
};
