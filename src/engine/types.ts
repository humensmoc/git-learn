import type { EngineResult, RepoSnapshot } from "./snapshot";

export type EngineMode = "sim" | "real";

export interface GitEngine {
  execute(command: string): Promise<EngineResult>;
  reset(): Promise<RepoSnapshot>;
  getSnapshot(): RepoSnapshot;
  getCompletions(input: string): string[];
}

