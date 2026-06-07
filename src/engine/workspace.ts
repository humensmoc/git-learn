export type WorkspaceOp = "touch" | "edit" | "rm";

export interface ParsedWorkspaceCommand {
  op: WorkspaceOp;
  path: string;
}

const workspaceOps: WorkspaceOp[] = ["touch", "edit", "rm"];

export function parseWorkspaceCommand(command: string): ParsedWorkspaceCommand | null {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] !== "workspace") return null;
  const op = tokens[1] as WorkspaceOp;
  const path = tokens[2];
  if (!workspaceOps.includes(op) || !path) return null;
  return { op, path };
}

export function buildWorkspaceCommand(op: WorkspaceOp, path: string): string {
  return `workspace ${op} ${path}`;
}
