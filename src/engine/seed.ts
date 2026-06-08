export type SeedId =
  | "empty"
  | "initialized-no-commit"
  | "main-with-commit"
  | "with-remote"
  | "two-branches"
  | "with-stash"
  | "with-gitignore";

export interface RepoSeed {
  id: SeedId;
}

export const SEED_IDS: SeedId[] = [
  "empty",
  "initialized-no-commit",
  "main-with-commit",
  "with-remote",
  "two-branches",
  "with-stash",
  "with-gitignore",
];
