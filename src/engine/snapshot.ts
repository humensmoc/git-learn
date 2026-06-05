export type RefType = "branch" | "tag" | "remote";

export interface CommitNode {
  hash: string;
  parents: string[];
  message: string;
  author: string;
  timestamp: number;
}

export interface RefNode {
  name: string;
  target: string;
  type: RefType;
}

export interface WorkingTreeEntry {
  path: string;
  status: "untracked" | "modified" | "staged" | "clean";
}

export interface RemoteNode {
  name: string;
  url: string;
  refs: RefNode[];
}

export interface RepoSnapshot {
  initialized: boolean;
  commits: CommitNode[];
  refs: RefNode[];
  head: string;
  remotes: RemoteNode[];
  index: string[];
  workingTree: WorkingTreeEntry[];
  files: string[];
}

export type AnimationEventType =
  | "CommitCreated"
  | "RefMoved"
  | "BranchCreated"
  | "MergeHappened"
  | "RemotePushed"
  | "CheckoutSwitched";

export interface AnimationEvent {
  type: AnimationEventType;
  payload?: Record<string, string>;
}

export interface EngineResult {
  output: string[];
  snapshot: RepoSnapshot;
  events: AnimationEvent[];
}

