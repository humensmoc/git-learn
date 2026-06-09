import { useCallback, useMemo } from "react";

import { LessonGoalPanel } from "../components/GoalPanel";
import type { GitSession } from "../hooks/useGitSession";
import type { CommandSource } from "../terminal/commandLog";
import { worlds } from "../lessons/data";
import { PlaygroundLayout } from "../playground/PlaygroundLayout";
import { useLessonController } from "./controller";

interface LessonPageProps {
  session: GitSession;
  darkMode: boolean;
  onPlayTick: () => void;
}

export const LessonPage = ({ session, darkMode, onPlayTick }: LessonPageProps) => {
  const lesson = useLessonController(session);

  const onCommand = useCallback(
    async (command: string, meta?: { source?: CommandSource; shortcutId?: string }) => {
      onPlayTick();
      if (command === "levels" || command === "hint") {
        lesson.handleMetaCommand(command);
        return;
      }
      if (command === "reset") {
        await lesson.resetLesson();
        return;
      }

      const source = meta?.source ?? (meta?.shortcutId ? "shortcut" : "terminal");
      const result = await session.runCommand(command, {
        source,
        shortcutId: meta?.shortcutId,
      });
      lesson.onGitResult(result.snapshot, command, result.output.length > 0);
    },
    [lesson, onPlayTick, session],
  );

  const getCompletions = useMemo(
    () => (input: string) => {
      const builtin = ["levels", "hint", "reset"].filter((item) => item.startsWith(input.trim()));
      return [...builtin, ...session.getCompletions(input)];
    },
    [session],
  );

  const goalOverlay = (
    <LessonGoalPanel
      world={lesson.currentWorld}
      worldIndex={lesson.worldIndex}
      totalWorlds={worlds.length}
      stepIndex={lesson.activeStepIndex}
      step={lesson.currentStep}
      checkpointStatus={lesson.checkpointStatus}
      awaitingStepConfirm={lesson.awaitingStepConfirm}
      worldCompleted={lesson.worldCompleted}
      feedback={lesson.feedback}
      onSelectWorld={(index) => void lesson.selectWorld(index)}
      onConfirmStep={lesson.confirmCurrentStep}
      onHint={lesson.showHint}
    />
  );

  return (
    <PlaygroundLayout
      snapshot={session.snapshot}
      history={session.history}
      engineMode={session.mode}
      onCommand={onCommand}
      getCompletions={getCompletions}
      darkMode={darkMode}
      rightOverlay={goalOverlay}
    />
  );
};
