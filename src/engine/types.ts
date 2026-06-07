import type { RepoSeed } from "./seed";
import type { EngineResult, RepoSnapshot } from "./snapshot";

export type EngineMode = "sim" | "real";

export interface GitEngine {
  execute(command: string): Promise<EngineResult>;
  reset(seed?: RepoSeed): Promise<RepoSnapshot>;
  getSnapshot(): RepoSnapshot;
  getCompletions(input: string): string[];
}

