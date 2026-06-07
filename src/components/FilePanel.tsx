import { useMemo, useState } from "react";

import type { RepoSnapshot } from "../engine/snapshot";
import type { EngineMode } from "../engine/types";
import { buildWorkspaceCommand } from "../engine/workspace";
import type { CommandSource } from "../terminal/commandLog";
import { ParamPickerDialog } from "./ParamPickerDialog";

interface FilePanelProps {
  snapshot: RepoSnapshot;
  engineMode: EngineMode;
  onCommand: (command: string, meta?: { source?: CommandSource }) => void | Promise<void>;
}

type FileZone = "working" | "staged";

const FILE_TEMPLATES = ["demo.txt", "feature.js", ".gitignore"];

export const FilePanel = ({ snapshot, engineMode, onCommand }: FilePanelProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<FileZone | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const workingEntries = useMemo(
    () => snapshot.workingTree.filter((entry) => entry.status !== "staged"),
    [snapshot.workingTree],
  );

  const selectedEntry = useMemo(() => {
    if (!selectedPath) return null;
    if (selectedZone === "staged") return { path: selectedPath, status: "staged" as const };
    return workingEntries.find((e) => e.path === selectedPath) ?? null;
  }, [selectedPath, selectedZone, workingEntries]);

  const run = (command: string) => {
    void onCommand(command, { source: "file-panel" });
    setSelectedPath(null);
    setSelectedZone(null);
  };

  const selectFile = (path: string, zone: FileZone) => {
    setSelectedPath(path);
    setSelectedZone(zone);
  };

  const simOnly = engineMode === "sim";
  const gitReady = snapshot.initialized;

  return (
    <section className="file-panel">
      <div className="file-groups">
        <div className="file-column">
          <h4>工作区</h4>
          <ul>
            {workingEntries.length ? (
              workingEntries.map((entry) => (
                <li key={entry.path}>
                  <button
                    type="button"
                    className={`file-row${selectedPath === entry.path && selectedZone === "working" ? " is-selected" : ""}`}
                    onClick={() => selectFile(entry.path, "working")}
                  >
                    <span>{entry.path}</span>
                    <em className={`file-status file-status--${entry.status}`}>{entry.status}</em>
                  </button>
                </li>
              ))
            ) : (
              <li className="file-empty">clean</li>
            )}
          </ul>
        </div>
        <div className="file-column">
          <h4>暂存区</h4>
          <ul>
            {snapshot.index.length ? (
              snapshot.index.map((file) => (
                <li key={file}>
                  <button
                    type="button"
                    className={`file-row${selectedPath === file && selectedZone === "staged" ? " is-selected" : ""}`}
                    onClick={() => selectFile(file, "staged")}
                  >
                    <span>{file}</span>
                    <em className="file-status file-status--staged">staged</em>
                  </button>
                </li>
              ))
            ) : (
              <li className="file-empty">empty</li>
            )}
          </ul>
        </div>
      </div>

      <div className="file-action-bar">
        {selectedEntry && selectedZone === "working" ? (
          <>
            {(selectedEntry.status === "untracked" || selectedEntry.status === "modified") && (
              <button type="button" disabled={!gitReady} title={gitReady ? undefined : "请先 git init"} onClick={() => run(`git add ${selectedEntry.path}`)}>
                暂存
              </button>
            )}
            {selectedEntry.status === "clean" && (
              <button type="button" onClick={() => run(buildWorkspaceCommand("edit", selectedEntry.path))}>
                标记修改
              </button>
            )}
            {selectedEntry.status === "modified" && (
              <button
                type="button"
                disabled={!simOnly || !gitReady}
                title={simOnly ? (gitReady ? undefined : "请先 git init") : "real 模式暂不支持"}
                onClick={() => run(`git restore ${selectedEntry.path}`)}
              >
                丢弃修改
              </button>
            )}
          </>
        ) : null}
        {selectedEntry && selectedZone === "staged" ? (
          <button
            type="button"
            disabled={!simOnly || !gitReady}
            title={simOnly ? (gitReady ? undefined : "请先 git init") : "real 模式暂不支持"}
            onClick={() => run(`git restore --staged ${selectedEntry.path}`)}
          >
            取消暂存
          </button>
        ) : null}
        {!selectedEntry ? <span className="file-action-hint">点击文件以操作</span> : null}
      </div>

      <div className="file-toolbar">
        <button type="button" onClick={() => setAddDialogOpen(true)}>
          + 添加文件
        </button>
        <button
          type="button"
          disabled={!selectedPath}
          onClick={() => selectedPath && run(buildWorkspaceCommand("rm", selectedPath))}
        >
          − 删除选中
        </button>
        <button type="button" disabled={!gitReady} title={gitReady ? undefined : "请先 git init"} onClick={() => run("git add .")}>
          全部暂存
        </button>
      </div>

      <ParamPickerDialog
        open={addDialogOpen}
        title="添加文件"
        placeholder="文件名，如 demo.txt"
        quickPicks={FILE_TEMPLATES}
        quickPickLabel="常用文件"
        onCancel={() => setAddDialogOpen(false)}
        onConfirm={(name) => {
          setAddDialogOpen(false);
          run(buildWorkspaceCommand("touch", name));
        }}
      />
    </section>
  );
};
