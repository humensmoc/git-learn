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
  /** Git 仓库是否已 init */
  initialized: boolean;
  /** 提交对象列表（DAG 节点） */
  commits: CommitNode[];
  /** 本地分支、标签与远程跟踪 ref */
  refs: RefNode[];
  /** 当前 HEAD 指向的分支名或 detached commit */
  head: string;
  remotes: RemoteNode[];
  /** 暂存区（index）中的文件路径 */
  index: string[];
  workingTree: WorkingTreeEntry[];
  /** 工作区已知文件路径 */
  files: string[];
  /** stash 栈深度（Git 可观测状态） */
  stashCount: number;
  /** @deprecated 优先使用 files.includes(".gitignore")；保留供引擎过渡 */
  hasGitignore: boolean;
  /** @deprecated 优先检查 refs 中 origin/branch；保留供引擎过渡 */
  upstreamSet: boolean;
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

