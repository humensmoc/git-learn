import { RealEngine } from "./real/realEngine";
import type { RepoSeed } from "./seed";
import { SimEngine } from "./sim/simEngine";
import type { RepoSnapshot } from "./snapshot";
import type { EngineMode, GitEngine } from "./types";

export class EngineRouter implements GitEngine {
  private readonly sim = new SimEngine();
  private readonly real = new RealEngine();
  private mode: EngineMode = "sim";

  setMode(mode: EngineMode) {
    this.mode = mode;
  }

  getMode(): EngineMode {
    return this.mode;
  }

  async execute(command: string) {
    return this.active().execute(command);
  }

  async reset(seed?: RepoSeed): Promise<RepoSnapshot> {
    return this.active().reset(seed);
  }

  getSnapshot(): RepoSnapshot {
    return this.active().getSnapshot();
  }

  getCompletions(input: string): string[] {
    return this.active().getCompletions(input);
  }

  private active(): GitEngine {
    return this.mode === "sim" ? this.sim : this.real;
  }
}

