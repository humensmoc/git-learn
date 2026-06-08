import type { SeedId } from "../engine/seed";

export type RiskLevel = "basic" | "advanced" | "danger";

export interface LessonStep {
  id: string;
  validatorId: string;
  title: string;
  instruction: string;
  commandHint: string;
  riskLevel?: RiskLevel;
  riskNote?: string;
}

export interface LessonWorld {
  id: string;
  title: string;
  description: string;
  mode: "sim" | "real";
  seedId?: SeedId;
  steps: LessonStep[];
}

