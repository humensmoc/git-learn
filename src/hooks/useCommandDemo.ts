import { useCallback, useEffect, useRef, useState } from "react";

import type { GitSession } from "./useGitSession";
import { demoCommandSequence } from "../terminal/testCommands";

export function useCommandDemo(session: GitSession) {
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  const cancelDemo = useCallback(() => {
    cancelRef.current = true;
    setIsRunning(false);
  }, []);

  const runDemo = useCallback(async () => {
    if (isRunning) {
      cancelDemo();
      return;
    }

    cancelRef.current = false;
    setIsRunning(true);
    session.clearTimeline();
    await session.resetRepo();
    session.appendHistory(["----- 开始命令演示 -----"]);

    for (const step of demoCommandSequence) {
      if (cancelRef.current) break;
      await session.runCommand(step.command, {
        source: "test",
        shortcutId: step.shortcutId,
      });
      await new Promise((resolve) => setTimeout(resolve, step.delayMs ?? 1000));
    }

    if (!cancelRef.current) {
      session.appendHistory(["----- 命令演示结束 -----"]);
    }
    setIsRunning(false);
  }, [cancelDemo, isRunning, session]);

  useEffect(() => () => cancelDemo(), [cancelDemo]);

  return { isRunning, runDemo, cancelDemo };
}
