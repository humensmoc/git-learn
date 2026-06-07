export interface DemoCommandStep {
  command: string;
  shortcutId?: string;
  delayMs?: number;
}

export const demoCommandSequence: DemoCommandStep[] = [
  { command: "git init", shortcutId: "init" },
  { command: "git status", shortcutId: "status" },
  { command: "git add .", shortcutId: "add" },
  { command: 'git commit -m "demo commit"', shortcutId: "commit" },
  { command: "git log --oneline", shortcutId: "log" },
  { command: "git branch feature", shortcutId: "branch" },
  { command: "git checkout -b hotfix", shortcutId: "checkout" },
  { command: "git switch main", shortcutId: "switch" },
  { command: "git merge feature", shortcutId: "merge" },
  { command: "git stash", shortcutId: "stash" },
  { command: "git stash list", shortcutId: "stash" },
  { command: "git stash pop", shortcutId: "stash" },
  { command: "git remote add origin https://github.com/demo/repo.git", shortcutId: "remote" },
  { command: "git push -u origin main", shortcutId: "push" },
  { command: "git pull", shortcutId: "pull" },
  { command: "git restore README.md", shortcutId: "restore" },
];
