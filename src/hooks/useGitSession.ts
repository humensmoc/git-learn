import { useCallback, useMemo, useState } from "react";

import { sharedRouter } from "../engine/routerInstance";
import type { RepoSeed } from "../engine/seed";
import type { EngineResult, RepoSnapshot } from "../engine/snapshot";
import type { EngineMode } from "../engine/types";

export interface GitSession {
  snapshot: RepoSnapshot;
  history: string[];
  mode: EngineMode;
  run: (command: string) => Promise<EngineResult>;
  resetRepo: (seed?: RepoSeed) => Promise<RepoSnapshot>;
  setMode: (mode: EngineMode) => void;
  getCompletions: (input: string) => string[];
  appendHistory: (lines: string[]) => void;
}

export function useGitSession(): GitSession {
  const [snapshot, setSnapshot] = useState<RepoSnapshot>(() => sharedRouter.getSnapshot());
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setModeState] = useState<EngineMode>(() => sharedRouter.getMode());

  const run = useCallback(async (command: string) => {
    const result = await sharedRouter.execute(command);
    setSnapshot(result.snapshot);
    setHistory((prev) => [...prev, `$ ${command}`, ...result.output]);
    return result;
  }, []);

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
    setHistory((prev) => [...prev, ...lines]);
  }, []);

  return useMemo(
    () => ({
      snapshot,
      history,
      mode,
      run,
      resetRepo,
      setMode,
      getCompletions,
      appendHistory,
    }),
    [snapshot, history, mode, run, resetRepo, setMode, getCompletions, appendHistory],
  );
}
