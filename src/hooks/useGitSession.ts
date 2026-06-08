import { useCallback, useMemo, useState } from "react";

import { sharedRouter } from "../engine/routerInstance";
import type { RepoSeed } from "../engine/seed";
import type { EngineResult, RepoSnapshot } from "../engine/snapshot";
import type { EngineMode } from "../engine/types";
import {
  createEntry,
  flattenTimeline,
  getCommandEntries,
  type CommandLogEntry,
  type RunCommandMeta,
  type TimelineItem,
} from "../terminal/commandLog";

export interface GitSession {
  snapshot: RepoSnapshot;
  history: string[];
  entries: CommandLogEntry[];
  timeline: TimelineItem[];
  mode: EngineMode;
  run: (command: string, meta?: RunCommandMeta) => Promise<EngineResult>;
  runCommand: (command: string, meta: RunCommandMeta) => Promise<EngineResult>;
  resetRepo: (seed?: RepoSeed) => Promise<RepoSnapshot>;
  setMode: (mode: EngineMode) => void;
  getCompletions: (input: string) => string[];
  appendHistory: (lines: string[]) => void;
  clearTimeline: () => void;
}

export function useGitSession(): GitSession {
  const [snapshot, setSnapshot] = useState<RepoSnapshot>(() => sharedRouter.getSnapshot());
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [mode, setModeState] = useState<EngineMode>(() => sharedRouter.getMode());

  const history = useMemo(() => flattenTimeline(timeline), [timeline]);
  const entries = useMemo(() => getCommandEntries(timeline), [timeline]);

  const runCommand = useCallback(async (command: string, meta: RunCommandMeta) => {
    const result = await sharedRouter.execute(command);
    setSnapshot(result.snapshot);
    const entry = createEntry(command, result.output, meta);
    setTimeline((prev) => [...prev, { type: "command", entry }]);
    return result;
  }, []);

  const run = useCallback(
    async (command: string, meta?: RunCommandMeta) =>
      runCommand(command, meta ?? { source: "terminal" }),
    [runCommand],
  );

  const resetRepo = useCallback(async (seed?: RepoSeed) => {
    const next = await sharedRouter.reset(seed);
    setSnapshot(next);
    return next;
  }, []);

  const setMode = useCallback((next: EngineMode) => {
    sharedRouter.setMode(next);
    setModeState(next);
  }, []);

  const getCompletions = useCallback((input: string) => sharedRouter.getCompletions(input), []);

  const appendHistory = useCallback((lines: string[]) => {
    if (!lines.length) return;
    setTimeline((prev) => [...prev, ...lines.map((line) => ({ type: "system" as const, line }))]);
  }, []);

  const clearTimeline = useCallback(() => {
    setTimeline([]);
  }, []);

  return useMemo(
    () => ({
      snapshot,
      history,
      entries,
      timeline,
      mode,
      run,
      runCommand,
      resetRepo,
      setMode,
      getCompletions,
      appendHistory,
      clearTimeline,
    }),
    [
      snapshot,
      history,
      entries,
      timeline,
      mode,
      run,
      runCommand,
      resetRepo,
      setMode,
      getCompletions,
      appendHistory,
      clearTimeline,
    ],
  );
}
