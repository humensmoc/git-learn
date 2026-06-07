import { useCallback, useMemo } from "react";

import type { GitSession } from "../hooks/useGitSession";
import type { EngineMode } from "../engine/types";
import { PlaygroundLayout } from "./PlaygroundLayout";

interface PlaygroundPageProps {
  session: GitSession;
  darkMode: boolean;
  onPlayTick: () => void;
}

export const PlaygroundPage = ({ session, darkMode, onPlayTick }: PlaygroundPageProps) => {
  const onCommand = useCallback(
    async (command: string) => {
      onPlayTick();
      if (command === "reset") {
        await session.resetRepo();
        session.appendHistory(["仓库已重置。"]);
        return;
      }
      await session.run(command);
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

  const toggleMode = useCallback(async () => {
    const next: EngineMode = session.mode === "sim" ? "real" : "sim";
    session.setMode(next);
    await session.resetRepo();
    session.appendHistory([`----- 引擎切换为 ${next.toUpperCase()} -----`]);
  }, [session]);

  return (
    <div className="playground-page">
      <div className="playground-toolbar">
        <button type="button" onClick={() => session.resetRepo().then(() => session.appendHistory(["仓库已重置。"]))}>
          重置仓库
        </button>
        <button type="button" onClick={toggleMode}>
          引擎: {session.mode.toUpperCase()}
        </button>
      </div>
      <PlaygroundLayout
        snapshot={session.snapshot}
        history={session.history}
        onCommand={onCommand}
        getCompletions={getCompletions}
        darkMode={darkMode}
      />
    </div>
  );
};
