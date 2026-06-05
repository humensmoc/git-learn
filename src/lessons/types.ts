import type { RepoSnapshot } from "../engine/snapshot";

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  commandHint: string;
  validate: (snapshot: RepoSnapshot, command: string) => boolean;
}

export interface LessonWorld {
  id: string;
  title: string;
  description: string;
  mode: "sim" | "real";
  steps: LessonStep[];
}

