import { useCallback, useEffect, useState } from "react";

import type { RepoSeed } from "../engine/seed";
import type { RepoSnapshot } from "../engine/snapshot";
import type { EngineMode } from "../engine/types";
import type { GitSession } from "../hooks/useGitSession";
import { worlds } from "../lessons/data";
import { validateStep } from "./validator";

const STORAGE_KEY = "git-learn-progress";

export type StepResult = "advance" | "stay" | "complete";

export interface LessonControllerState {
  worldIndex: number;
  stepIndex: number;
  feedback: string[];
  currentWorld: (typeof worlds)[number];
  activeStepIndex: number;
  currentStep: (typeof worlds)[number]["steps"][number];
  checkpointStatus: Array<{ id: string; title: string; done: boolean }>;
  awaitingStepConfirm: boolean;
  worldCompleted: boolean;
  selectWorld: (index: number) => Promise<void>;
  confirmCurrentStep: () => void;
  showHint: () => void;
  handleMetaCommand: (cmd: "levels" | "hint") => void;
  resetLesson: () => Promise<void>;
  onGitResult: (snapshot: RepoSnapshot, command: string, hadOutput: boolean) => StepResult;
}

function worldSeed(world: (typeof worlds)[number]): RepoSeed {
  return { id: world.seedId ?? "empty" };
}

export function useLessonController(session: GitSession): LessonControllerState {
  const [worldIndex, setWorldIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [worldLoaded, setWorldLoaded] = useState(false);
  const [completedCheckpointIds, setCompletedCheckpointIds] = useState<string[]>([]);
  const [awaitingStepConfirm, setAwaitingStepConfirm] = useState(false);
  const [worldCompleted, setWorldCompleted] = useState(false);

  const currentWorld = worlds[worldIndex];
  const activeStepIndex = Math.min(stepIndex, currentWorld.steps.length - 1);
  const currentStep = currentWorld.steps[activeStepIndex];
  const checkpointStatus =
    currentStep.checkpoints?.map((cp) => ({
      id: cp.id,
      title: cp.title,
      done: completedCheckpointIds.includes(cp.id),
    })) ?? [];

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { worldIndex: number; stepIndex: number };
      setWorldIndex(Math.min(worlds.length - 1, Math.max(0, parsed.worldIndex)));
      setStepIndex(Math.max(0, parsed.stepIndex));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ worldIndex, stepIndex }));
  }, [stepIndex, worldIndex, hydrated]);

  const applyWorld = useCallback(
    async (index: number, resetStep: boolean) => {
      const world = worlds[index];
      const mode = world.mode as EngineMode;
      session.setMode(mode);
      await session.resetRepo(worldSeed(world));
      session.appendHistory([`----- 进入 ${world.title} (${mode.toUpperCase()}) -----`]);
      const intro = [`已进入 ${world.title}，请按提示输入命令。`];
      if (world.steps[0]?.riskNote) {
        intro.push(`安全提示：${world.steps[0].riskNote}`);
      }
      setFeedback(intro);
      setCompletedCheckpointIds([]);
      setAwaitingStepConfirm(false);
      setWorldCompleted(false);
      if (resetStep) setStepIndex(0);
    },
    [session],
  );

  useEffect(() => {
    if (!hydrated || worldLoaded) return;
    setWorldLoaded(true);
    void applyWorld(worldIndex, false);
  }, [applyWorld, hydrated, worldIndex, worldLoaded]);

  const selectWorld = useCallback(
    async (index: number) => {
      const next = Math.min(worlds.length - 1, Math.max(0, index));
      if (next === worldIndex) return;
      if (next > worldIndex && !worldCompleted) {
        setFeedback(["当前关卡还未完成。请先完成当前关卡，再进入下一关。"]);
        return;
      }
      setWorldIndex(next);
      await applyWorld(next, true);
    },
    [applyWorld, worldCompleted, worldIndex],
  );

  const showHint = useCallback(() => {
    const lines = [`提示：${currentStep.commandHint}`];
    if (currentStep.checkpoints?.length) {
      const pending = currentStep.checkpoints.find((cp) => !completedCheckpointIds.includes(cp.id));
      if (pending) lines.unshift(`当前检查点：${pending.title}`);
    }
    if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
    setFeedback(lines);
  }, [completedCheckpointIds, currentStep]);

  const handleMetaCommand = useCallback(
    (cmd: "levels" | "hint") => {
      if (cmd === "levels") {
        setFeedback(["关卡列表：", ...worlds.map((w, i) => `${i + 1}. ${w.title}`)]);
        return;
      }
      showHint();
    },
    [showHint],
  );

  const resetLesson = useCallback(async () => {
    await session.resetRepo(worldSeed(currentWorld));
    setStepIndex(0);
    setCompletedCheckpointIds([]);
    setAwaitingStepConfirm(false);
    setWorldCompleted(false);
    setFeedback(["仓库已重置，请从当前步骤重新输入命令。"]);
  }, [currentWorld, session]);

  const confirmCurrentStep = useCallback(() => {
    if (!awaitingStepConfirm) return;
    setAwaitingStepConfirm(false);
    setCompletedCheckpointIds([]);
    if (activeStepIndex >= currentWorld.steps.length - 1) {
      setWorldCompleted(true);
      setFeedback(["当前关卡已完成。你现在可以进入下一关。"]);
      return;
    }
    const nextIndex = activeStepIndex + 1;
    setStepIndex(nextIndex);
    const nextStep = currentWorld.steps[nextIndex];
    if (nextStep?.riskNote) {
      setFeedback(["已确认完成本步骤，进入下一步。", `安全提示：${nextStep.riskNote}`]);
    } else {
      setFeedback(["已确认完成本步骤，进入下一步。"]);
    }
  }, [activeStepIndex, awaitingStepConfirm, currentWorld.steps]);

  const onGitResult = useCallback(
    (snapshot: RepoSnapshot, command: string, hadOutput: boolean): StepResult => {
      if (awaitingStepConfirm) {
        if (hadOutput) {
          setFeedback(["本步骤检查点已全部完成，请点击“完成本步骤”再进入下一步。"]);
        }
        return "stay";
      }

      if (currentStep.checkpoints?.length) {
        const pendingCheckpoint = currentStep.checkpoints.find((cp) => !completedCheckpointIds.includes(cp.id));
        if (!pendingCheckpoint) {
          setAwaitingStepConfirm(true);
          setFeedback(["本步骤检查点已全部完成，请点击“完成本步骤”进入下一步。"]);
          return "stay";
        }

        if (validateStep(pendingCheckpoint.validatorId, snapshot, command)) {
          const nextCompleted = [...completedCheckpointIds, pendingCheckpoint.id];
          setCompletedCheckpointIds(nextCompleted);
          const nextCheckpoint = currentStep.checkpoints.find((cp) => !nextCompleted.includes(cp.id));
          if (nextCheckpoint) {
            setFeedback([`检查点已完成：${pendingCheckpoint.title}`, `下一检查点：${nextCheckpoint.title}`]);
          } else {
            setAwaitingStepConfirm(true);
            if (activeStepIndex >= currentWorld.steps.length - 1) {
              setFeedback(["本关所有命令检查点已完成，请点击“完成本步骤”后进入下一关。"]);
            } else {
              setFeedback(["本步骤所有检查点已完成，请点击“完成本步骤”进入下一步。"]);
            }
          }
          return "stay";
        }

        if (hadOutput) {
          const lines = [`当前检查点未通过：${pendingCheckpoint.title}`];
          if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
          setFeedback(lines);
        }
        return "stay";
      }

      if (validateStep(currentStep.validatorId, snapshot, command)) {
        const nextIndex = Math.min(activeStepIndex + 1, currentWorld.steps.length - 1);
        if (nextIndex === currentWorld.steps.length - 1 && nextIndex === activeStepIndex) {
          setWorldCompleted(true);
          setFeedback(["当前关卡已完成。你现在可以进入下一关。"]);
          return "complete";
        }
        setStepIndex(nextIndex);
        setCompletedCheckpointIds([]);
        setAwaitingStepConfirm(false);
        const nextStep = currentWorld.steps[nextIndex];
        if (nextStep?.riskNote && nextIndex !== activeStepIndex) {
          setFeedback(["当前步骤已完成，继续下一步。", `安全提示：${nextStep.riskNote}`]);
        } else {
          setFeedback(["当前步骤已完成，继续下一步。"]);
        }
        return "advance";
      }
      if (hadOutput) {
        const lines = ["继续根据当前步骤提示输入命令。"];
        if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
        setFeedback(lines);
      }
      return "stay";
    },
    [activeStepIndex, awaitingStepConfirm, completedCheckpointIds, currentStep, currentWorld],
  );

  return {
    worldIndex,
    stepIndex,
    feedback,
    currentWorld,
    activeStepIndex,
    currentStep,
    checkpointStatus,
    awaitingStepConfirm,
    worldCompleted,
    selectWorld,
    confirmCurrentStep,
    showHint,
    handleMetaCommand,
    resetLesson,
    onGitResult,
  };
}
