import type { CommitNode, RepoSnapshot } from "../engine/snapshot";

export interface PositionedCommit extends CommitNode {
  x: number;
  y: number;
}

export interface PositionedRef {
  name: string;
  x: number;
  y: number;
  target: string;
  type: "branch" | "tag" | "remote";
}

const lanePalette = ["main", "feature", "hotfix", "develop"];

export const buildGraphLayout = (snapshot: RepoSnapshot) => {
  const commitByHash = new Map(snapshot.commits.map((c) => [c.hash, c]));
  const laneByCommit = new Map<string, number>();
  const branchRefs = snapshot.refs.filter((ref) => ref.type === "branch");

  branchRefs.forEach((ref, index) => {
    const lane = index % Math.max(lanePalette.length, branchRefs.length || 1);
    let current = ref.target;
    while (current) {
      if (!laneByCommit.has(current)) laneByCommit.set(current, lane);
      const node = commitByHash.get(current);
      if (!node || node.parents.length === 0) break;
      current = node.parents[0];
    }
  });

  const ordered = [...snapshot.commits].sort((a, b) => a.timestamp - b.timestamp);
  const commits: PositionedCommit[] = ordered.map((commit, index) => ({
    ...commit,
    x: 80 + index * 120,
    y: 90 + (laneByCommit.get(commit.hash) ?? 0) * 100,
  }));

  const posByHash = new Map(commits.map((c) => [c.hash, c]));
  const refs: PositionedRef[] = snapshot.refs
    .map((ref) => {
      const target = posByHash.get(ref.target);
      if (!target) return null;
      return {
        name: ref.name,
        target: ref.target,
        type: ref.type,
        x: target.x,
        y: target.y - (ref.type === "remote" ? 44 : 30),
      };
    })
    .filter(Boolean) as PositionedRef[];

  return {
    commits,
    refs,
    edges: commits.flatMap((commit) =>
      commit.parents.map((parent) => ({
        from: commit.hash,
        to: parent,
      })),
    ),
    width: Math.max(900, commits.length * 140),
    height: Math.max(420, (branchRefs.length + 2) * 120),
  };
};

