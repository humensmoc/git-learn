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
  selectWorld: (index: number) => Promise<void>;
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

  const currentWorld = worlds[worldIndex];
  const activeStepIndex = Math.min(stepIndex, currentWorld.steps.length - 1);
  const currentStep = currentWorld.steps[activeStepIndex];

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
      setWorldIndex(next);
      await applyWorld(next, true);
    },
    [applyWorld, worldIndex],
  );

  const showHint = useCallback(() => {
    const lines = [`提示：${currentStep.commandHint}`];
    if (currentStep.riskNote) lines.push(`安全提示：${currentStep.riskNote}`);
    setFeedback(lines);
  }, [currentStep]);

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
    setFeedback(["仓库已重置，请从当前步骤重新输入命令。"]);
  }, [currentWorld, session]);

  const onGitResult = useCallback(
    (snapshot: RepoSnapshot, command: string, hadOutput: boolean): StepResult => {
      if (validateStep(currentStep.validatorId, snapshot, command)) {
        const nextIndex = Math.min(activeStepIndex + 1, currentWorld.steps.length - 1);
        setStepIndex(nextIndex);
        const nextStep = currentWorld.steps[nextIndex];
        if (nextStep?.riskNote && nextIndex !== activeStepIndex) {
          setFeedback(["当前步骤已完成，继续下一步。", `安全提示：${nextStep.riskNote}`]);
        } else {
          setFeedback(["当前步骤已完成，继续下一步。"]);
        }
        if (nextIndex === currentWorld.steps.length - 1 && nextIndex === activeStepIndex) {
          return "complete";
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
    [activeStepIndex, currentStep, currentWorld],
  );

  return {
    worldIndex,
    stepIndex,
    feedback,
    currentWorld,
    activeStepIndex,
    currentStep,
    selectWorld,
    showHint,
    handleMetaCommand,
    resetLesson,
    onGitResult,
  };
}
