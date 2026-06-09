import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";

import type { RepoSnapshot } from "../engine/snapshot";
import { getLocalBranchNames, getTrackedFileNames } from "../terminal/snapshotHelpers";
import {
  buildShortcutCommand,
  gitShortcuts,
  type GitShortcut,
  type ShortcutHelp,
  type ShortcutOption,
} from "../terminal/shortcuts";
import { ParamPickerDialog } from "./ParamPickerDialog";

interface ShortcutDockProps {
  open: boolean;
  snapshot: RepoSnapshot;
  onCommand: (command: string, shortcutId?: string) => void | Promise<void>;
}

export const ShortcutDock = ({ open, snapshot, onCommand }: ShortcutDockProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [pending, setPending] = useState<{
    shortcut: GitShortcut;
    option: ShortcutOption;
  } | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    help: ShortcutHelp;
    commandPreview: string;
    left: number;
    top: number;
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

  const getOptionPreview = (shortcut: GitShortcut, option: ShortcutOption) => {
    if (option.exampleCommand) return option.exampleCommand;
    if (option.input) return `${shortcut.prefix} <参数>`;
    return buildShortcutCommand(shortcut, option);
  };

  const showTip = (
    event: MouseEvent<HTMLButtonElement>,
    help: ShortcutHelp | undefined,
    commandPreview: string,
  ) => {
    if (!help || !dockRef.current) return;
    const hostRect = dockRef.current.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = 124;
    const spaceBelow = hostRect.bottom - targetRect.bottom;
    const preferredTop =
      spaceBelow >= estimatedHeight
        ? targetRect.bottom - hostRect.top + 8
        : targetRect.top - hostRect.top - estimatedHeight - 8;
    const tooltipWidth = 280;
    const maxLeft = Math.max(8, hostRect.width - tooltipWidth - 8);
    const left = Math.min(Math.max(targetRect.left - hostRect.left, 8), maxLeft);
    setHoverTip({ help, commandPreview, left, top: preferredTop });
  };

  const hideTip = () => setHoverTip(null);

  return (
    <div ref={dockRef} className={`shortcut-dock${open ? " is-open" : ""}`}>
      <div className="shortcut-toolbar">
        {gitShortcuts.map((shortcut) => {
          const isExpanded = expandedId === shortcut.id;
          return (
            <div
              key={shortcut.id}
              className={`shortcut-pill shortcut-pill--${shortcut.id}${isExpanded ? " is-expanded" : ""}`}
            >
              <button
                type="button"
                className="pill-main"
                onClick={() => handleMainClick(shortcut)}
                onMouseEnter={(event) =>
                  showTip(
                    event,
                    shortcut.help,
                    buildShortcutCommand(shortcut, undefined, undefined) || shortcut.prefix,
                  )
                }
                onMouseLeave={hideTip}
              >
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
                      onMouseEnter={(event) => showTip(event, option.help ?? shortcut.help, getOptionPreview(shortcut, option))}
                      onMouseLeave={hideTip}
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
      {hoverTip ? (
        <div className="shortcut-tooltip" style={{ left: hoverTip.left, top: hoverTip.top }} role="tooltip">
          <p className="shortcut-tooltip-title">{hoverTip.help.purpose}</p>
          <p>
            <strong>会做什么：</strong>
            <code>{hoverTip.commandPreview}</code>
            <span>{hoverTip.help.effect}</span>
          </p>
          <p>
            <strong>常见场景：</strong>
            <span>{hoverTip.help.scenario}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};
