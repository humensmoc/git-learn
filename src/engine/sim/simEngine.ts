import type { RepoSeed } from "../seed";
import type { EngineResult, RepoSnapshot, RefNode, WorkingTreeEntry } from "../snapshot";
import type { GitEngine } from "../types";
import { parseWorkspaceCommand } from "../workspace";

type BranchMap = Record<string, string>;

interface SimCommit {
  hash: string;
  parents: string[];
  message: string;
  author: string;
  timestamp: number;
}

interface SimStash {
  files: string[];
  message: string;
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
  stashes: SimStash[];
  ignoredPatterns: string[];
  hasGitignore: boolean;
  upstreamSet: boolean;
  pullRebaseUsed: boolean;
}

const gitCommands = [
  "init",
  "status",
  "add",
  "commit",
  "log",
  "diff",
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
  "stash",
  "reset",
  "restore",
  "revert",
  "rm",
];

const shortHash = () => Math.random().toString(16).slice(2, 10);

export class SimEngine implements GitEngine {
  private state: SimState = this.createInitialState();

  async execute(command: string): Promise<EngineResult> {
    const input = command.trim();
    if (!input) {
      return this.ok([""], []);
    }

    const workspace = parseWorkspaceCommand(input);
    if (workspace) {
      return this.handleWorkspace(workspace.op, workspace.path);
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
        return this.handleLog(args);
      case "diff":
        return this.handleDiff(args);
      case "branch":
        return this.handleBranch(args);
      case "checkout":
      case "switch":
        return this.handleCheckout(sub, args);
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
      case "stash":
        return this.handleStash(args);
      case "reset":
        return this.handleReset(args);
      case "restore":
        return this.handleRestore(args);
      case "revert":
        return this.handleRevert(args);
      case "rm":
        return this.handleRm(args);
      default:
        if (sub === "rebas") {
          return this.ok([`git: '${sub}' 不是可用命令`, "提示: 你是不是想输入 git rebase ？"], []);
        }
        return this.ok([`git: '${sub}' 不是可用命令`], []);
    }
  }

  async reset(seed?: RepoSeed): Promise<RepoSnapshot> {
    this.loadFromSeed(seed);
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
      workingTree: [...this.state.workingTree.entries()].map(([path, status]) => ({ path, status })),
      files: [...this.state.files],
      stashCount: this.state.stashes.length,
      hasGitignore: this.state.hasGitignore,
      upstreamSet: this.state.upstreamSet,
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
    if (tokens[1] === "restore" && tokens.length === 3) {
      return [...this.state.workingTree.keys()].map((f) => `git restore ${f}`);
    }
    return [];
  }

  private createInitialState(): SimState {
    const workingTree = new Map<string, WorkingTreeEntry["status"]>();
    workingTree.set("README.md", "untracked");
    workingTree.set("app.js", "untracked");
    return {
      initialized: false,
      commits: [],
      branches: { main: "" },
      head: "main",
      detachedHead: null,
      index: new Set<string>(),
      files: new Set<string>(),
      workingTree,
      remotes: {},
      stashes: [],
      ignoredPatterns: [],
      hasGitignore: false,
      upstreamSet: false,
      pullRebaseUsed: false,
    };
  }

  private loadFromSeed(seed?: RepoSeed): void {
    const id = seed?.id ?? "empty";
    this.state = this.createInitialState();

    const addCommit = (message: string, author = "student") => {
      const hash = shortHash();
      const commit: SimCommit = {
        hash,
        parents: this.state.commits.length ? [this.state.commits[this.state.commits.length - 1].hash] : [],
        message,
        author,
        timestamp: Date.now(),
      };
      this.state.commits.push(commit);
      return hash;
    };

    switch (id) {
      case "empty":
        break;
      case "initialized-no-commit":
        this.state.initialized = true;
        break;
      case "main-with-commit": {
        this.state.initialized = true;
        const hash = addCommit("initial commit");
        this.state.branches.main = hash;
        this.state.files.add("README.md");
        this.state.files.add("app.js");
        this.state.workingTree.set("README.md", "clean");
        this.state.workingTree.set("app.js", "clean");
        break;
      }
      case "with-remote": {
        this.state.initialized = true;
        const hash = addCommit("initial commit");
        this.state.branches.main = hash;
        this.state.files.add("README.md");
        this.state.workingTree.set("README.md", "clean");
        this.state.remotes.origin = {
          url: "https://github.com/demo/repo.git",
          branches: { main: hash },
        };
        break;
      }
      case "two-branches": {
        this.state.initialized = true;
        const hash = addCommit("initial commit");
        this.state.branches.main = hash;
        this.state.branches.feature = hash;
        this.state.files.add("README.md");
        this.state.workingTree.set("README.md", "clean");
        break;
      }
      case "with-stash": {
        this.state.initialized = true;
        this.state.workingTree.set("README.md", "modified");
        this.state.stashes.push({ files: ["README.md"], message: "WIP on main" });
        break;
      }
      case "with-gitignore": {
        this.state.initialized = true;
        this.state.hasGitignore = true;
        this.state.files.add(".gitignore");
        this.state.workingTree.set(".gitignore", "untracked");
        this.state.workingTree.set("README.md", "untracked");
        break;
      }
    }
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

  private seedModified(file: string) {
    this.state.workingTree.set(file, "modified");
    this.state.files.add(file);
  }

  private handleWorkspace(op: string, path: string): EngineResult {
    switch (op) {
      case "touch": {
        if (this.state.workingTree.has(path)) {
          return this.ok([`文件 ${path} 已存在`], []);
        }
        this.state.files.add(path);
        this.state.workingTree.set(path, "untracked");
        return this.ok([`已创建文件 ${path}（未跟踪）`], []);
      }
      case "edit": {
        if (!this.state.workingTree.has(path)) {
          this.state.files.add(path);
          this.state.workingTree.set(path, "untracked");
          return this.ok([`已创建文件 ${path}（未跟踪）`], []);
        }
        const status = this.state.workingTree.get(path);
        if (status === "staged") {
          return this.ok([`${path} 已在暂存区`], []);
        }
        if (status === "clean") {
          this.seedModified(path);
          return this.ok([`已标记 ${path} 为已修改`], []);
        }
        return this.ok([`${path} 已是 ${status} 状态`], []);
      }
      case "rm":
        return this.handleRm([path]);
      default:
        return this.ok([`workspace: 未知操作 '${op}'`], []);
    }
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
    const changed = [...this.state.workingTree.entries()].filter(
      ([, status]) => status === "modified" || status === "untracked",
    );
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

    if (target === ".gitignore") {
      this.state.hasGitignore = true;
      this.state.ignoredPatterns.push("node_modules/", ".env");
    }

    const files =
      target === "."
        ? [...this.state.workingTree.keys()].filter((f) => !this.isIgnored(f))
        : [target];
    files.forEach((f) => {
      this.state.files.add(f);
      this.state.index.add(f);
      this.state.workingTree.set(f, "staged");
    });
    return this.ok([`已暂存 ${files.length} 个文件`], []);
  }

  private isIgnored(path: string): boolean {
    if (!this.state.hasGitignore) return false;
    return this.state.ignoredPatterns.some((p) => path.startsWith(p.replace("/", "")) || path.includes(p));
  }

  private handleCommit(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    const isAmend = args.includes("--amend");
    if (isAmend) {
      const last = this.state.commits[this.state.commits.length - 1];
      if (!last) return this.ok(["fatal: 没有可 amend 的提交"], []);
      const msgFlag = args.indexOf("-m");
      if (msgFlag >= 0) {
        last.message = args.slice(msgFlag + 1).join(" ").replaceAll('"', "");
      }
      return this.ok(
        [`[${this.state.head} ${last.hash.slice(0, 7)}] ${last.message} (amended)`, "警告: 仅适用于未 push 的提交"],
        [],
      );
    }

    const isAll = args.includes("-a") || args.includes("-am");
    if (isAll) {
      [...this.state.workingTree.entries()]
        .filter(([, s]) => s === "modified")
        .forEach(([f]) => {
          this.state.index.add(f);
          this.state.workingTree.set(f, "staged");
        });
    }

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

  private handleLog(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    if (this.state.commits.length === 0) return this.ok(["还没有提交历史"], []);
    const oneline = args.includes("--oneline");
    const rangeArg = args.find((a) => a.includes(".."));
    let commits = [...this.state.commits].reverse();
    if (rangeArg) {
      commits = commits.slice(0, 3);
    }
    const output = commits.map((c) =>
      oneline ? `${c.hash.slice(0, 7)} ${c.message}` : `commit ${c.hash}\nAuthor: ${c.author}\n    ${c.message}`,
    );
    return this.ok(output, []);
  }

  private handleDiff(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const staged = args.includes("--staged") || args.includes("--cached");
    if (staged) {
      const files = [...this.state.index];
      if (!files.length) return this.ok(["(no staged changes)"], []);
      return this.ok(files.map((f) => `diff --git a/${f} b/${f}\n+simulated staged content`), []);
    }
    const modified = [...this.state.workingTree.entries()].filter(([, s]) => s === "modified" || s === "untracked");
    if (!modified.length) return this.ok(["(no unstaged changes)"], []);
    return this.ok(modified.map(([f]) => `diff --git a/${f} b/${f}\n+simulated unstaged content`), []);
  }

  private handleBranch(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    if (args[0] === "-M" && args[1]) {
      const newName = args[1];
      const oldTarget = this.state.branches[this.state.head];
      delete this.state.branches[this.state.head];
      this.state.branches[newName] = oldTarget;
      this.state.head = newName;
      return this.ok([`已将分支重命名为 ${newName}`], []);
    }

    if (args.includes("-a")) {
      const local = Object.keys(this.state.branches).map((b) => `  ${b}`);
      const remote = Object.entries(this.state.remotes).flatMap(([r, data]) =>
        Object.keys(data.branches).map((b) => `  remotes/${r}/${b}`),
      );
      return this.ok([...local, ...remote], []);
    }

    const createFlag = args[0] === "-c" || args[0] === "-b";
    const name = createFlag ? args[1] : args[0];
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

  private handleCheckout(sub: string, args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    const createFlag = args[0] === "-b" || args[0] === "-c";
    const branch = createFlag ? args[1] : args[0];
    if (!branch) return this.ok(["fatal: 需要一个分支名"], []);

    if (createFlag) {
      if (this.state.branches[branch]) return this.ok([`fatal: 分支 ${branch} 已存在`], []);
      this.state.branches[branch] = this.currentHeadCommit();
    }

    if (!this.state.branches[branch]) return this.ok([`error: pathspec '${branch}' did not match any branch`], []);
    this.state.head = branch;
    this.state.detachedHead = null;
    const verb = sub === "switch" ? "switch" : "checkout";
    return this.ok([`Switched to branch '${branch}' (${verb})`], [{ type: "CheckoutSwitched", payload: { branch } }]);
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
    const onto = args[0]?.replace("origin/", "") ?? args[0];
    if (!onto || !this.state.branches[onto]) {
      return this.ok(["fatal: 指定要 rebase 到的分支", "警告: rebase 会改写历史，团队协作优先 merge"], []);
    }
    this.state.branches[this.state.head] = this.state.branches[onto];
    return this.ok(
      [`Successfully rebased and updated ${this.state.head}.`, "警告: 仅适用于未 push 的本地分支"],
      [{ type: "RefMoved", payload: { ref: this.state.head, target: this.state.branches[onto] } }],
    );
  }

  private handleRemote(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    if (args[0] === "add" && args[1]) {
      const looksLikeUrl = args[1].includes("://") || args[1].startsWith("git@");
      const remoteName = looksLikeUrl ? "origin" : args[1];
      const remoteUrl = looksLikeUrl ? args[1] : args[2];
      if (!remoteUrl) {
        return this.ok(["提示: 建议使用 git remote add origin <url>"], []);
      }
      this.state.remotes[remoteName] = { url: remoteUrl, branches: { main: "" } };
      return this.ok([`已添加远端 ${remoteName} -> ${remoteUrl}`], []);
    }

    if (args[0] === "set-url" && args[1] && args[2]) {
      const remote = this.state.remotes[args[1]];
      if (!remote) return this.ok([`fatal: remote ${args[1]} 不存在`], []);
      remote.url = args[2];
      return this.ok([`已将 ${args[1]} 地址更新为 ${args[2]}`], []);
    }

    if (args[0] === "-v" || args.length === 0) {
      const lines = Object.entries(this.state.remotes).flatMap(([name, r]) => [
        `${name}\t${r.url} (fetch)`,
        `${name}\t${r.url} (push)`,
      ]);
      return this.ok(lines.length ? lines : ["(no remotes)"], []);
    }

    return this.ok(["支持: git remote add/set-url/-v"], []);
  }

  private handleFetch(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const remoteName = args[0] ?? "origin";
    const remote = this.state.remotes[remoteName];
    if (!remote) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    remote.branches.main = this.state.branches.main || shortHash();
    return this.ok([`From ${remote.url}`, ` * [new branch] main -> ${remoteName}/main`], []);
  }

  private handlePush(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const hasUpstream = args.includes("-u");
    const filtered = args.filter((a) => a !== "-u");
    const remoteName = filtered[0] ?? "origin";
    const branch = filtered[1] ?? this.state.head;
    const remote = this.state.remotes[remoteName];
    if (!remote) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    remote.branches[branch] = this.state.branches[this.state.head];
    if (hasUpstream) this.state.upstreamSet = true;
    return this.ok(
      [`To ${remote.url}`, `   ${branch} -> ${branch}`, hasUpstream ? `branch '${branch}' set up to track '${remoteName}/${branch}'.` : ""].filter(Boolean),
      [{ type: "RemotePushed", payload: { remote: remoteName, branch } }],
    );
  }

  private handlePull(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    if (args[0] === "rebase") {
      return this.ok(["提示: 你输入的是 git pull rebase", "正确写法: git pull --rebase"], []);
    }
    const remoteName = args[0] ?? "origin";
    if (!this.state.remotes[remoteName]) return this.ok([`fatal: remote ${remoteName} 不存在`], []);
    if (args.includes("--rebase")) {
      this.state.pullRebaseUsed = true;
      return this.ok([`Already up to date. (pull --rebase)`], []);
    }
    return this.ok([`Already up to date.`], []);
  }

  private handleClone(args: string[]): EngineResult {
    const url = args[0];
    if (!url) return this.ok(["fatal: usage git clone <url>"], []);
    this.state = this.createInitialState();
    this.state.initialized = true;
    const hash = shortHash();
    const commit: SimCommit = {
      hash,
      parents: [],
      message: "initial clone",
      author: "remote",
      timestamp: Date.now(),
    };
    this.state.commits.push(commit);
    this.state.branches.main = hash;
    this.state.remotes.origin = { url, branches: { main: hash } };
    this.state.workingTree.clear();
    return this.ok([`Cloning into 'demo'...`, `remote: Enumerating objects...`, `Receiving objects: 100%`], []);
  }

  private handleStash(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    if (args[0] === "list") {
      if (!this.state.stashes.length) return this.ok(["(no stash entries)"], []);
      return this.ok(this.state.stashes.map((s, i) => `stash@{${i}}: ${s.message}`), []);
    }

    if (args[0] === "pop") {
      const stash = this.state.stashes.pop();
      if (!stash) return this.ok(["fatal: 没有可恢复的 stash"], []);
      stash.files.forEach((f) => this.seedModified(f));
      return this.ok([`已恢复 stash: ${stash.message}`], []);
    }

    const files = [...this.state.workingTree.entries()]
      .filter(([, s]) => s === "modified" || s === "untracked")
      .map(([f]) => f);
    if (!files.length) return this.ok(["No local changes to save"], []);
    this.state.stashes.push({ files, message: "WIP on " + this.state.head });
    files.forEach((f) => this.state.workingTree.set(f, "clean"));
    return this.ok([`Saved working directory and index state`], []);
  }

  private handleReset(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    if (args[0] === "HEAD" && args[1]) {
      const file = args[1];
      this.state.index.delete(file);
      return this.ok([`已取消暂存 ${file}`], []);
    }

    const mode = args.includes("--hard") ? "hard" : args.includes("--soft") ? "soft" : "mixed";
    const targetHash = args.find((a) => !a.startsWith("--") && a !== "HEAD") ?? this.state.commits.at(-2)?.hash;

    if (mode === "hard") {
      if (this.state.commits.length > 1) {
        this.state.commits.pop();
        const top = this.state.commits[this.state.commits.length - 1];
        this.state.branches[this.state.head] = top?.hash ?? "";
      }
      this.state.index.clear();
      return this.ok(
        ["HEAD is now at previous commit", "危险: reset --hard 会丢弃改动，已 push 分支请用 git revert"],
        [],
      );
    }

    if (mode === "soft") {
      return this.ok(["重置到目标提交，改动保留在暂存区"], []);
    }

    if (this.state.commits.length > 1 && targetHash) {
      const idx = this.state.commits.findIndex((c) => c.hash.startsWith(targetHash) || c.hash === targetHash);
      if (idx >= 0) {
        this.state.commits = this.state.commits.slice(0, idx + 1);
        this.state.branches[this.state.head] = this.state.commits[idx].hash;
      }
    }
    this.state.index.clear();
    return this.ok(["重置到目标提交，改动保留在工作区 (mixed)"], []);
  }

  private handleRestore(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);

    const staged = args.includes("--staged");
    const file = args.find((a) => !a.startsWith("--"));
    if (!file) return this.ok(["fatal: 需要指定文件"], []);

    if (staged) {
      this.state.index.delete(file);
      this.state.workingTree.set(file, "modified");
      return this.ok([`已取消暂存 ${file}`], []);
    }

    this.state.workingTree.set(file, "clean");
    return this.ok([`已丢弃工作区对 ${file} 的修改`], []);
  }

  private handleRevert(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const target = args[0];
    if (!target) return this.ok(["fatal: 需要指定提交 hash"], []);

    const commit: SimCommit = {
      hash: shortHash(),
      parents: [this.currentHeadCommit()].filter(Boolean),
      message: `Revert "${target}"`,
      author: "student",
      timestamp: Date.now(),
    };
    this.state.commits.push(commit);
    this.state.branches[this.state.head] = commit.hash;
    return this.ok(
      [`[${this.state.head} ${commit.hash.slice(0, 7)}] ${commit.message}`, "推荐: 已 push 历史用 revert 而非 reset --hard"],
      [{ type: "CommitCreated", payload: { hash: commit.hash } }],
    );
  }

  private handleRm(args: string[]): EngineResult {
    const err = this.ensureInitialized();
    if (err) return this.ok([err], []);
    const cached = args.includes("--cached");
    const recursive = args.includes("-r");
    const file = args.find((a) => !a.startsWith("-"));
    if (!file) return this.ok(["fatal: 需要指定路径"], []);

    if (cached || recursive) {
      this.state.index.delete(file);
      this.state.workingTree.set(file, "untracked");
      return this.ok([`rm '${file}' (保留工作区文件，停止跟踪)`], []);
    }

    this.state.files.delete(file);
    this.state.index.delete(file);
    this.state.workingTree.delete(file);
    return this.ok([`rm '${file}'`], []);
  }
}
