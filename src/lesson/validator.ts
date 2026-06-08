import type { RepoSnapshot } from "../engine/snapshot";
import {
  cmdAny,
  cmdIncludes,
  cmdIs,
  hasBranch,
  hasRemote,
  hasUpstreamTracking,
} from "../lessons/helpers";

export type StepValidator = (snapshot: RepoSnapshot, command: string) => boolean;

export const validators: Record<string, StepValidator> = {
  "w1-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w1-add-all": (snapshot, command) => snapshot.index.length > 0 && cmdIs("git add")(command),
  "w1-commit": (snapshot, command) => snapshot.commits.length >= 1 && cmdIs("git commit")(command),
  "w1-log-oneline": (_snapshot, command) => cmdIncludes("git log", "--oneline")(command),
  "w1-status": (_snapshot, command) => cmdIs("git status")(command),

  "w2-init": (snapshot, command) =>
    snapshot.initialized &&
    (cmdIs("git init")(command) || cmdIs("git add")(command) || cmdIs("git commit")(command)),
  "w2-branch-m": (snapshot, command) =>
    snapshot.head === "main" && cmdIncludes("git branch", "-M", "main")(command),
  "w2-remote-add": (snapshot, command) =>
    hasRemote(snapshot, "origin") && cmdIs("git remote add")(command),
  "w2-push-u": (snapshot, command) =>
    hasUpstreamTracking(snapshot, "origin", "main") &&
    cmdIncludes("git push", "-u")(command),

  "w3-clone": (snapshot, command) =>
    snapshot.initialized && hasRemote(snapshot, "origin") && cmdIs("git clone")(command),
  "w3-fetch": (snapshot, command) =>
    snapshot.refs.some((r) => r.type === "remote") && cmdIs("git fetch")(command),
  "w3-pull": (_snapshot, command) => cmdIs("git pull")(command) && !command.includes("--rebase"),
  "w3-pull-rebase": (_snapshot, command) => cmdIncludes("git pull", "--rebase")(command),

  "w4-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w4-status": (_snapshot, command) => cmdIs("git status")(command),
  "w4-diff": (_snapshot, command) => cmdIs("git diff")(command) && !command.includes("--staged"),
  "w4-diff-staged": (snapshot, command) =>
    (snapshot.index.length > 0 && cmdIncludes("git diff", "--staged")(command)) ||
    cmdIs("git add")(command),
  "w4-remote-v": (snapshot, command) =>
    (hasRemote(snapshot, "origin") && cmdAny(["git remote -v", "git remote"])(command)) ||
    cmdIs("git remote add")(command),

  "w5-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w5-add-file": (snapshot, command) =>
    snapshot.index.includes("README.md") && cmdIs("git add")(command),
  "w5-commit-m": (snapshot, command) =>
    snapshot.commits.length >= 1 && cmdIs("git commit")(command),
  "w5-add-all": (snapshot, command) => cmdIs("git add")(command) && snapshot.index.length > 0,
  "w5-commit-am": (_snapshot, command) =>
    cmdIncludes("git commit", "-am")(command) || cmdIncludes("git commit", "-a")(command),

  "w6-init": (snapshot, command) =>
    snapshot.initialized &&
    (cmdIs("git init")(command) ||
      cmdIs("git add")(command) ||
      (snapshot.commits.length > 0 && cmdIs("git commit")(command))),
  "w6-branch-list": (_snapshot, command) => cmdIs("git branch")(command) && !command.includes("-"),
  "w6-branch-create": (snapshot, command) =>
    hasBranch(snapshot, "feature") && cmdIncludes("git branch", "feature")(command),
  "w6-switch-c": (snapshot, command) =>
    (snapshot.head === "hotfix" && cmdIncludes("git switch", "-c")(command)) ||
    (hasBranch(snapshot, "hotfix") && cmdIs("git switch")(command)),
  "w6-checkout-b": (snapshot, command) =>
    snapshot.head === "develop" && cmdIncludes("git checkout", "-b")(command),

  "w7-setup": (snapshot, command) =>
    hasBranch(snapshot, "feature") ||
    cmdIs("git init")(command) ||
    cmdIs("git add")(command) ||
    cmdIs("git commit")(command) ||
    cmdIs("git branch")(command),
  "w7-merge": (snapshot, command) =>
    snapshot.commits.some((c) => c.parents.length > 1) && cmdIs("git merge")(command),
  "w7-rebase": (_snapshot, command) => cmdIs("git rebase")(command),

  "w8-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w8-stash": (snapshot, command) =>
    snapshot.stashCount >= 1 &&
    cmdIs("git stash")(command) &&
    !command.includes("pop") &&
    !command.includes("list"),
  "w8-stash-list": (_snapshot, command) => cmdIncludes("git stash", "list")(command),
  "w8-stash-pop": (snapshot, command) =>
    cmdIncludes("git stash", "pop")(command) && snapshot.stashCount === 0,

  "w9-init-commit": (snapshot, command) =>
    snapshot.commits.length >= 1 ||
    cmdIs("git init")(command) ||
    cmdIs("git add")(command) ||
    cmdIs("git commit")(command),
  "w9-restore-staged": (snapshot, command) =>
    (cmdIncludes("git restore", "--staged")(command) && !snapshot.index.includes("README.md")) ||
    cmdIs("git add")(command),
  "w9-restore-file": (_snapshot, command) =>
    cmdIs("git restore")(command) && !command.includes("--staged"),
  "w9-reset-head": (_snapshot, command) => cmdIncludes("git reset", "HEAD")(command),
  "w9-reset-soft": (_snapshot, command) => cmdIncludes("git reset", "--soft")(command),

  "w10-setup": (snapshot, command) =>
    snapshot.commits.length >= 1 ||
    cmdIs("git init")(command) ||
    cmdIs("git add")(command) ||
    cmdIs("git commit")(command),
  "w10-amend": (_snapshot, command) => cmdIncludes("git commit", "--amend")(command),
  "w10-revert": (snapshot, command) =>
    cmdIs("git revert")(command) && snapshot.commits.some((c) => c.message.startsWith("Revert")),
  "w10-reset-hard": (_snapshot, command) => cmdIncludes("git reset", "--hard")(command),

  "w11-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w11-gitignore": (snapshot, command) =>
    snapshot.files.includes(".gitignore") && cmdIncludes("git add", ".gitignore")(command),
  "w11-add-tracked": (snapshot, command) =>
    snapshot.commits.length >= 1 || cmdIs("git add")(command) || cmdIs("git commit")(command),
  "w11-rm-cached": (snapshot, command) =>
    cmdIncludes("git rm", "--cached")(command) && !snapshot.index.includes("README.md"),

  "w12-setup": (snapshot, command) =>
    hasRemote(snapshot, "origin") ||
    cmdIs("git init")(command) ||
    cmdIs("git add")(command) ||
    cmdIs("git commit")(command) ||
    cmdIs("git remote add")(command),
  "w12-fetch": (_snapshot, command) => cmdIncludes("git fetch", "origin")(command),
  "w12-rebase-origin": (_snapshot, command) => cmdIncludes("git rebase", "origin/main")(command),
  "w12-log-range": (_snapshot, command) => cmdIncludes("git log", "origin/main..HEAD")(command),
  "w12-remote-set-url": (snapshot, command) =>
    hasRemote(snapshot, "origin") &&
    snapshot.remotes[0]?.url.includes("git@github.com") &&
    cmdIncludes("git remote", "set-url")(command),

  "w13-init": (snapshot, command) => snapshot.initialized && cmdIs("git init")(command),
  "w13-add": (_snapshot, command) => cmdIs("git add")(command),
  "w13-commit": (snapshot, command) =>
    snapshot.commits.length >= 1 && cmdIs("git commit")(command),
  "w13-log": (_snapshot, command) => cmdIs("git log")(command),
};

export function validateStep(validatorId: string, snapshot: RepoSnapshot, command: string): boolean {
  const fn = validators[validatorId];
  if (!fn) return false;
  return fn(snapshot, command);
}
