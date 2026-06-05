import type { RepoSnapshot } from "../engine/snapshot";

export type RiskLevel = "basic" | "advanced" | "danger";

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  commandHint: string;
  riskLevel?: RiskLevel;
  riskNote?: string;
  validate: (snapshot: RepoSnapshot, command: string) => boolean;
}

export interface LessonWorld {
  id: string;
  title: string;
  description: string;
  mode: "sim" | "real";
  steps: LessonStep[];
}

