import type { EngineResult, RepoSnapshot, RefNode, WorkingTreeEntry } from "../snapshot";
import type { GitEngine } from "../types";

type BranchMap = Record<string, string>;

interface SimCommit {
  hash: string;
  parents: string[];
  message: string;
  author: string;
  timestamp: number;
}

interface SimState {
  initialized: boolean;
  commits: SimCommit[];
  branches: BranchMap;
  head: string;
  detachedHead: string | null;
  index: Set<string>;
  files: Set<string>;
  workingTree: Map<string, WorkingTreeEntry["status"]>;
  remotes: Record<string, { url: string; branches: BranchMap }>;
}

const gitCommands = [
  "init",
  "status",
  "add",
  "commit",
  "log",
  "branch",
  "checkout",
  "switch",
  "merge",
  "rebase",
  "remote",
  "fetch",
  "push",
  "pull",
  "clone",
];

const shortHash = () => Math.random().toString(16).slice(2, 10);

export class SimEngine implements GitEngine {
  private state: SimState = this.createInitialState();

  async execute(command: string): Promise<EngineResult> {
    const input = command.trim();
    if (!input) {
      return this.ok([""], []);
    }

    const tokens = input.split(/\s+/);
    if (tokens[0] !== "git") {
      return this.ok([`未知命令: ${input}`, "提示: 请输入 git 子命令。"], []);
    }

    const sub = tokens[1];
    const args = tokens.slice(2);

    switch (sub) {
      case "init":
        return this.handleInit();
      case "status":
        return this.handleStatus();
      case "add":
        return this.handleAdd(args);
      case "commit":
        return this.handleCommit(args);
      case "log":
        return this.handleLog();
      case "branch":
        return this.handleBranch(args);
      case "checkout":
      case "switch":
        return this.handleCheckout(args);
      case "merge":
        return this.handleMerge(args);
      case "rebase":
        return this.handleRebase(args);
      case "remote":
        return this.handleRemote(args);
      case "fetch":
        return this.handleFetch(args);
      case "push":
        return this.handlePush(args);
      case "pull":
        return this.handlePull(args);
      case "clone":
        return this.handleClone(args);
      default:
        return this.ok([`git: '${sub}' 不是可用命令`], []);
    }
  }

  async reset(): Promise<RepoSnapshot> {
    this.state = this.createInitialState();
    return this.getSnapshot();
  }

  getSnapshot(): RepoSnapshot {
    const refs: RefNode[] = Object.entries(this.state.branches).map(([name, target]) => ({
      name,
      target,
      type: "branch",
    }));

    Object.entries(this.state.remotes).forEach(([remoteName, remote]) => {
      Object.entries(remote.branches).forEach(([branch, target]) => {
        refs.push({
          name: `${remoteName}/${branch}`,
          target,
          type: "remote",
        });
      });
    });

    return {
      initialized: this.state.initialized,
      commits: this.state.commits,
      refs,
      head: this.state.detachedHead ?? this.state.head,
      remotes: Object.entries(this.state.remotes).map(([name, remote]) => ({
        name,
        url: remote.url,
        refs: Object.entries(remote.branches).map(([branch, target]) => ({
          name: `${name}/${branch}`,
          target,
          type: "remote" as const,
        })),
      })),
      index: [...this.state.index],
      workingTree: [...this.state.workingTree.values()].map((_, idx) => {
        const path = [...this.state.workingTree.keys()][idx];
        return { path, status: this.state.workingTree.get(path) ?? "clean" };
      }),
      files: [...this.state.files],
    };
  }

  getCompletions(input: string): string[] {
    const tokens = input.trim().split(/\s+/);
    if (!input.trim()) {
      return ["git "];
    }
    if (tokens.length === 1 && "git".startsWith(tokens[0])) {
      return ["git "];
    }
    if (tokens[0] !== "git") return [];
    if (tokens.length === 2) {
      return gitCommands
        .filter((cmd) => cmd.startsWith(tokens[1]))
        .map((cmd) => `git ${cmd}`);
    }
    if (tokens[1] === "checkout" || tokens[1] === "switch" || tokens[1] === "merge" || tokens[1] === "rebase") {
      const prefix = tokens[tokens.length - 1];
      return Object.keys(this.state.branches)
        .filter((name) => name.startsWith(prefix))
        .map((name) => `git ${tokens[1]} ${name}`);
    }
    return [];
  }

  private createInitialState(): SimState {
    return {
      initialized: false,
      commits: [],
      branches: { main: "" },
      head: "main",
      detachedHead: null,
      index: new Set<string>(),
      files: new Set<string>(),
      workingTree: new Map<string, WorkingTreeEntry["status"]>(),
      remotes: {},
    };
  }

  private ok(output: string[], events: EngineResult["events"]): EngineResult {
    return {
      output,
      snapshot: this.getSnapshot(),
      events,
    };
  }

  private ensureInitialized(): string | null {
    if (!this.state.initialized) return "fatal: 这不是一个 git 仓库，请先执行 git init";
    return null;
  }

  private currentHeadCommit(): string {
    if (this.state.detachedHead) return this.state.detachedHead;
    return this.state.branches[this.state.head] ?? "";
  }

  private handleInit(): EngineResult {
    if (this.state.initialized) {
      return this.ok(["Reinitialized existing Git repository (simulated)"], []);
    }
    this.state.initialized = true;
    this.state.branches.main = "";
    this.state.head = "main";
    return this.ok(
      ["Initialized empty Git repository in /sim/.git/", "默认分支: main"],
      [{ type: "BranchCreated", payload: { name: "main" } }],
    );
  }

  private handleStatus(): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const staged = [...this.state.index];
    const changed = [...this.state.workingTree.entries()].filter(([, status]) => status === "modified" || status === "untracked");
    const output = [`On branch ${this.state.detachedHead ? "(detached)" : this.state.head}`];
    if (staged.length === 0 && changed.length === 0) {
      output.push("nothing to commit, working tree clean");
      return this.ok(output, []);
    }
    if (staged.length) {
      output.push("Changes to be committed:");
      staged.forEach((file) => output.push(`  new file: ${file}`));
    }
    if (changed.length) {
      output.push("Changes not staged for commit:");
      changed.forEach(([file, status]) => output.push(`  ${status}: ${file}`));
    }
    return this.ok(output, []);
  }

  private handleAdd(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const target = args[0];
    if (!target) return this.ok(["fatal: 你需要指定文件，或使用 git add ."], []);

    const files = target === "." ? [...this.state.workingTree.keys()] : [target];
    files.forEach((f) => {
      this.state.files.add(f);
      this.state.index.add(f);
      this.state.workingTree.set(f, "staged");
    });
    return this.ok([`已暂存 ${files.length} 个文件`], []);
  }

  private handleCommit(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    if (this.state.index.size === 0) {
      return this.ok(["nothing to commit, working tree clean"], []);
    }

    const msgFlag = args.indexOf("-m");
    const message = msgFlag >= 0 ? args.slice(msgFlag + 1).join(" ").replaceAll('"', "") : "update";
    const newCommit: SimCommit = {
      hash: shortHash(),
      parents: this.currentHeadCommit() ? [this.currentHeadCommit()] : [],
      message,
      author: "student",
      timestamp: Date.now(),
    };
    this.state.commits.push(newCommit);
    if (this.state.detachedHead) {
      this.state.detachedHead = newCommit.hash;
    } else {
      this.state.branches[this.state.head] = newCommit.hash;
    }

    [...this.state.index].forEach((file) => this.state.workingTree.set(file, "clean"));
    this.state.index.clear();

    return this.ok(
      [`[${this.state.head} ${newCommit.hash.slice(0, 7)}] ${message}`, ` 1 file changed`],
      [
        { type: "CommitCreated", payload: { hash: newCommit.hash } },
        { type: "RefMoved", payload: { ref: this.state.head, target: newCommit.hash } },
      ],
    );
  }

  private handleLog(): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    if (this.state.commits.length === 0) return this.ok(["还没有提交历史"], []);
    const output = [...this.state.commits]
      .reverse()
      .map((c) => `commit ${c.hash}\nAuthor: ${c.author}\n    ${c.message}`);
    return this.ok(output, []);
  }

  private handleBranch(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const name = args[0];
    if (!name) {
      const output = Object.keys(this.state.branches).map((branch) =>
        branch === this.state.head ? `* ${branch}` : `  ${branch}`,
      );
      return this.ok(output, []);
    }
    if (this.state.branches[name]) return this.ok([`fatal: 分支 ${name} 已存在`], []);
    this.state.branches[name] = this.currentHeadCommit();
    return this.ok([`已创建分支 ${name}`], [{ type: "BranchCreated", payload: { name } }]);
  }

  private handleCheckout(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const branch = args[0];
    if (!branch) return this.ok(["fatal: 需要一个分支名"], []);
    if (!this.state.branches[branch]) return this.ok([`error: pathspec '${branch}' did not match any branch`], []);
    this.state.head = branch;
    this.state.detachedHead = null;
    return this.ok([`Switched to branch '${branch}'`], [{ type: "CheckoutSwitched", payload: { branch } }]);
  }

  private handleMerge(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const from = args[0];
    if (!from || !this.state.branches[from]) return this.ok(["fatal: 指定要合并的分支"], []);
    const target = this.currentHeadCommit();
    const source = this.state.branches[from];
    if (!source) return this.ok([`分支 ${from} 没有提交可合并`], []);

    const commit: SimCommit = {
      hash: shortHash(),
      parents: [target, source].filter(Boolean),
      message: `merge ${from} into ${this.state.head}`,
      author: "student",
      timestamp: Date.now(),
    };
    this.state.commits.push(commit);
    this.state.branches[this.state.head] = commit.hash;
    return this.ok(
      [`Merge made by the 'ort' strategy.`],
      [
        { type: "MergeHappened", payload: { from, to: this.state.head } },
        { type: "RefMoved", payload: { ref: this.state.head, target: commit.hash } },
      ],
    );
  }

  private handleRebase(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const onto = args[0];
    if (!onto || !this.state.branches[onto]) return this.ok(["fatal: 指定要 rebase 到的分支"], []);
    this.state.branches[this.state.head] = this.state.branches[onto];
    return this.ok(
      [`Successfully rebased and updated ${this.state.head}.`],
      [{ type: "RefMoved", payload: { ref: this.state.head, target: this.state.branches[onto] } }],
    );
  }

  private handleRemote(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    if (args[0] === "add" && args[1] && args[2]) {
      this.state.remotes[args[1]] = { url: args[2], branches: { main: "" } };
      return this.ok([`已添加远端 ${args[1]} -> ${args[2]}`], []);
    }
    return this.ok(["支持: git remote add <name> <url>"], []);
  }

  private handleFetch(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const remoteName = args[0] ?? "origin";
    const remote = this.state.remotes[remoteName];
    if (!remote) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    return this.ok([`From ${remote.url}`, ` * [new branch] main -> ${remoteName}/main`], []);
  }

  private handlePush(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const remoteName = args[0] ?? "origin";
    const branch = args[1] ?? this.state.head;
    const remote = this.state.remotes[remoteName];
    if (!remote) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    remote.branches[branch] = this.state.branches[this.state.head];
    return this.ok(
      [`To ${remote.url}`, `   ${branch} -> ${branch}`],
      [{ type: "RemotePushed", payload: { remote: remoteName, branch } }],
    );
  }

  private handlePull(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const remoteName = args[0] ?? "origin";
    if (!this.state.remotes[remoteName]) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    return this.ok([`Already up to date.`], []);
  }

  private handleClone(args: string[]): EngineResult {
    const url = args[0];
    if (!url) return this.ok(["fatal: usage git clone <url>"], []);
    this.state = this.createInitialState();
    this.state.initialized = true;
    this.state.remotes.origin = { url, branches: { main: "" } };
    return this.ok([`Cloning into 'demo'...`, `remote: Enumerating objects...`], []);
  }
}

