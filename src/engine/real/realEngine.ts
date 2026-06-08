import git from "isomorphic-git";
import LightningFS from "@isomorphic-git/lightning-fs";

import type { RepoSeed } from "../seed";
import type { EngineResult, RepoSnapshot } from "../snapshot";
import type { GitEngine } from "../types";
import { parseWorkspaceCommand } from "../workspace";

const fs = new LightningFS("git-learn-fs");
const pfs = fs.promises;
const dir = "/repo";

const support = ["init", "status", "add", "commit", "log"];

export class RealEngine implements GitEngine {
  private initialized = false;
  private snapshot: RepoSnapshot = {
    initialized: false,
    commits: [],
    refs: [],
    head: "main",
    remotes: [],
    index: [],
    workingTree: [],
    files: [],
    stashCount: 0,
    hasGitignore: false,
    upstreamSet: false,
  };

  async execute(command: string): Promise<EngineResult> {
    const tokens = command.trim().split(/\s+/);
    if (!tokens[0]) return this.ok([""], []);

    const workspace = parseWorkspaceCommand(command);
    if (workspace) {
      return this.handleWorkspace(workspace.op, workspace.path);
    }

    if (tokens[0] !== "git") return this.ok(["real 模式仅支持 git 命令"], []);
    const sub = tokens[1];
    const args = tokens.slice(2);
    if (!support.includes(sub)) {
      return this.ok([`real 模式暂不支持 git ${sub}`], []);
    }
    try {
      await this.ensureRepoDir();
      switch (sub) {
        case "init":
          await git.init({ fs, dir, defaultBranch: "main" });
          this.initialized = true;
          break;
        case "status":
          break;
        case "add": {
          const file = args[0];
          if (!file) return this.ok(["usage: git add <file>"], []);
          await this.ensureFile(file);
          await git.add({ fs, dir, filepath: file });
          break;
        }
        case "commit": {
          const msgFlag = args.indexOf("-m");
          const message = msgFlag >= 0 ? args.slice(msgFlag + 1).join(" ").replaceAll('"', "") : "update";
          await git.commit({
            fs,
            dir,
            message,
            author: { name: "student", email: "student@gitlearn.local" },
          });
          break;
        }
        case "log":
          break;
      }
      await this.refreshSnapshot();
      if (sub === "status") {
        return this.ok(this.buildStatusOutput(), []);
      }
      if (sub === "log") {
        return this.ok(this.buildLogOutput(), []);
      }
      return this.ok([`real> 已执行 git ${sub}`], []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.ok([`real 引擎错误: ${message}`], []);
    }
  }

  async reset(_seed?: RepoSeed): Promise<RepoSnapshot> {
    await pfs.rmdir(dir).catch(() => undefined);
    this.initialized = false;
    this.snapshot = {
      initialized: false,
      commits: [],
      refs: [],
      head: "main",
      remotes: [],
      index: [],
      workingTree: [],
      files: [],
      stashCount: 0,
      hasGitignore: false,
      upstreamSet: false,
    };
    return this.snapshot;
  }

  getSnapshot(): RepoSnapshot {
    return this.snapshot;
  }

  getCompletions(input: string): string[] {
    const tokens = input.trim().split(/\s+/);
    if (!input.trim()) return ["git "];
    if (tokens[0] !== "git") return [];
    if (tokens.length === 2) {
      return support.filter((s) => s.startsWith(tokens[1])).map((s) => `git ${s}`);
    }
    return [];
  }

  private ok(output: string[], events: EngineResult["events"]): EngineResult {
    return { output, snapshot: this.snapshot, events };
  }

  private async ensureRepoDir() {
    await pfs.mkdir(dir).catch(() => undefined);
  }

  private async ensureFile(filePath: string) {
    const absolute = `${dir}/${filePath}`;
    const segments = filePath.split("/").slice(0, -1);
    let current = dir;
    for (const segment of segments) {
      current = `${current}/${segment}`;
      await pfs.mkdir(current).catch(() => undefined);
    }
    await pfs.writeFile(absolute, `demo ${Date.now()}`);
  }

  private async handleWorkspace(op: string, path: string): Promise<EngineResult> {
    try {
      await this.ensureRepoDir();
      switch (op) {
        case "touch": {
          const exists = await pfs.stat(`${dir}/${path}`).catch(() => null);
          if (exists) return this.ok([`文件 ${path} 已存在`], []);
          await this.ensureFile(path);
          await this.syncLooseSnapshot(path, "untracked");
          return this.ok([`已创建文件 ${path}（未跟踪）`], []);
        }
        case "edit": {
          const exists = await pfs.stat(`${dir}/${path}`).catch(() => null);
          if (!exists) {
            await this.ensureFile(path);
            await this.syncLooseSnapshot(path, "untracked");
            return this.ok([`已创建文件 ${path}（未跟踪）`], []);
          }
          await this.ensureFile(path);
          if (this.initialized) {
            await this.refreshSnapshot();
            return this.ok([`已更新 ${path}`], []);
          }
          await this.syncLooseSnapshot(path, "modified");
          return this.ok([`已标记 ${path} 为已修改`], []);
        }
        case "rm": {
          await pfs.unlink(`${dir}/${path}`).catch(() => undefined);
          if (this.initialized) {
            await git.remove({ fs, dir, filepath: path }).catch(() => undefined);
            await this.refreshSnapshot();
          } else {
            this.snapshot = {
              ...this.snapshot,
              files: this.snapshot.files.filter((f) => f !== path),
              workingTree: this.snapshot.workingTree.filter((e) => e.path !== path),
            };
          }
          return this.ok([`已删除 ${path}`], []);
        }
        default:
          return this.ok([`workspace: 未知操作 '${op}'`], []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.ok([`real 引擎错误: ${message}`], []);
    }
  }

  private async syncLooseSnapshot(path: string, status: "untracked" | "modified") {
    if (this.initialized) {
      await this.refreshSnapshot();
      return;
    }
    this.snapshot = {
      ...this.snapshot,
      files: [...new Set([...this.snapshot.files, path])],
      workingTree: [
        ...this.snapshot.workingTree.filter((e) => e.path !== path),
        { path, status },
      ],
    };
  }

  private async refreshSnapshot() {
    if (!this.initialized) {
      this.snapshot = {
        initialized: false,
        commits: [],
        refs: [],
        head: "main",
        remotes: [],
        index: [],
        workingTree: [],
        files: [],
        stashCount: 0,
        hasGitignore: false,
        upstreamSet: false,
      };
      return;
    }

    const branches = await git.listBranches({ fs, dir }).catch(() => []);
    const refs = [];
    for (const branch of branches) {
      const oid = await git.resolveRef({ fs, dir, ref: branch }).catch(() => "");
      refs.push({ name: branch, target: oid, type: "branch" as const });
    }
    const logs = await git.log({ fs, dir, depth: 50 }).catch(() => []);
    const statuses: RepoSnapshot["workingTree"] = [];
    const files = (await pfs.readdir(dir).catch(() => [])) as string[];
    for (const f of files) {
      if (f === ".git") continue;
      const status = await git.status({ fs, dir, filepath: f }).catch(() => "absent");
      if (status !== "unmodified") {
        statuses.push({ path: f, status: status === "*added" ? "untracked" : "modified" });
      }
    }

    this.snapshot = {
      initialized: true,
      commits: logs.map((entry) => ({
        hash: entry.oid,
        parents: entry.commit.parent,
        message: entry.commit.message.trim(),
        author: entry.commit.author.name,
        timestamp: entry.commit.author.timestamp * 1000,
      })),
      refs,
      head: branches[0] ?? "main",
      remotes: [],
      index: [],
      workingTree: statuses,
      files: files.filter((f) => f !== ".git"),
      stashCount: 0,
      hasGitignore: files.includes(".gitignore"),
      upstreamSet: false,
    };
  }

  private buildStatusOutput(): string[] {
    if (!this.snapshot.initialized) return ["fatal: 这不是一个 git 仓库"];
    if (this.snapshot.workingTree.length === 0) return ["nothing to commit, working tree clean"];
    return this.snapshot.workingTree.map((entry) => `${entry.status}: ${entry.path}`);
  }

  private buildLogOutput(): string[] {
    if (this.snapshot.commits.length === 0) return ["暂无 commit"];
    return this.snapshot.commits.map((commit) => `commit ${commit.hash}\n    ${commit.message}`);
  }
}

