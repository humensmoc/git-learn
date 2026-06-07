import type { RepoSnapshot } from "../engine/snapshot";

export function getLocalBranchNames(snapshot: RepoSnapshot): string[] {
  const names = snapshot.refs
    .filter((ref) => ref.type === "branch")
    .map((ref) => ref.name)
    .filter(Boolean);
  if (names.length) return [...new Set(names)];
  if (snapshot.head && !snapshot.head.startsWith("detached")) return [snapshot.head];
  return [];
}

export function getTrackedFileNames(snapshot: RepoSnapshot): string[] {
  return [...new Set(snapshot.files.filter((f) => f !== ".gitignore"))];
}
