export type CommandSource = "terminal" | "shortcut" | "test" | "file-panel";

export interface CommandLogEntry {
  id: string;
  command: string;
  source: CommandSource;
  shortcutId?: string;
  output: string[];
  timestamp: number;
}

export type TimelineItem =
  | { type: "command"; entry: CommandLogEntry }
  | { type: "system"; line: string };

export interface RunCommandMeta {
  source: CommandSource;
  shortcutId?: string;
}

let entryCounter = 0;

export function createEntry(command: string, output: string[], meta: RunCommandMeta): CommandLogEntry {
  entryCounter += 1;
  return {
    id: `cmd-${entryCounter}`,
    command,
    source: meta.source,
    shortcutId: meta.shortcutId,
    output,
    timestamp: Date.now(),
  };
}

export function flattenEntry(entry: CommandLogEntry): string[] {
  return [`$ ${entry.command}`, ...entry.output];
}

export function flattenTimeline(timeline: TimelineItem[]): string[] {
  return timeline.flatMap((item) => (item.type === "command" ? flattenEntry(item.entry) : [item.line]));
}

export function getCommandEntries(timeline: TimelineItem[]): CommandLogEntry[] {
  return timeline.filter((item): item is { type: "command"; entry: CommandLogEntry } => item.type === "command").map((item) => item.entry);
}
