import { useCallback, useMemo } from "react";

import type { GitSession } from "../hooks/useGitSession";
import type { CommandSource } from "../terminal/commandLog";
import { PlaygroundLayout } from "./PlaygroundLayout";

interface PlaygroundPageProps {
  session: GitSession;
  darkMode: boolean;
  onPlayTick: () => void;
}

export const PlaygroundPage = ({ session, darkMode, onPlayTick }: PlaygroundPageProps) => {
  const onCommand = useCallback(
    async (command: string, meta?: { source?: CommandSource; shortcutId?: string }) => {
      onPlayTick();
      if (command === "reset") {
        await session.resetRepo();
        session.appendHistory(["仓库已重置。"]);
        return;
      }
      const source = meta?.source ?? (meta?.shortcutId ? "shortcut" : "terminal");
      await session.runCommand(command, {
        source,
        shortcutId: meta?.shortcutId,
      });
    },
    [onPlayTick, session],
  );

  const getCompletions = useMemo(
    () => (input: string) => {
      const builtin = ["reset"].filter((item) => item.startsWith(input.trim()));
      return [...builtin, ...session.getCompletions(input)];
    },
    [session],
  );

  return (
    <div className="playground-page">
      <PlaygroundLayout
        snapshot={session.snapshot}
        history={session.history}
        engineMode={session.mode}
        onCommand={onCommand}
        getCompletions={getCompletions}
        darkMode={darkMode}
      />
    </div>
  );
};
