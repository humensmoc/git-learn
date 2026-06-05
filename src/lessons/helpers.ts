import type { RepoSnapshot } from "../engine/snapshot";

export const cmdIs = (prefix: string) => (command: string) => command.trim().startsWith(prefix);

export const cmdAny = (prefixes: string[]) => (command: string) =>
  prefixes.some((prefix) => command.trim().startsWith(prefix));

export const cmdIncludes = (...parts: string[]) => (command: string) => {
  const trimmed = command.trim();
  return parts.every((part) => trimmed.includes(part));
};

export const hasBranch = (snapshot: RepoSnapshot, name: string) =>
  snapshot.refs.some((ref) => ref.type === "branch" && ref.name === name);

export const hasRemote = (snapshot: RepoSnapshot, name: string) =>
  snapshot.remotes.some((remote) => remote.name === name);
