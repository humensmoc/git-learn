import type { LessonWorld } from "../lessons/types";

interface LessonPanelProps {
  world: LessonWorld;
  worldIndex: number;
  totalWorlds: number;
  stepIndex: number;
  onSelectWorld: (index: number) => void;
}

export const LessonPanel = ({
  world,
  worldIndex,
  totalWorlds,
  stepIndex,
  onSelectWorld,
}: LessonPanelProps) => {
  const step = world.steps[stepIndex];
  return (
    <section className="lesson-panel card">
      <header className="lesson-header">
        <h2>{world.title}</h2>
        <span className="badge">{world.mode.toUpperCase()}</span>
      </header>
      <p className="lesson-description">{world.description}</p>
      <p className="lesson-progress">
        进度：Step {stepIndex + 1} / {world.steps.length}
      </p>
      <h3>{step.title}</h3>
      <p>{step.instruction}</p>
      <code>{step.commandHint}</code>
      <div className="world-switch">
        <button type="button" onClick={() => onSelectWorld(Math.max(0, worldIndex - 1))}>
          上一关
        </button>
        <span>
          {worldIndex + 1} / {totalWorlds}
        </span>
        <button
          type="button"
          onClick={() => onSelectWorld(Math.min(totalWorlds - 1, worldIndex + 1))}
        >
          下一关
        </button>
      </div>
    </section>
  );
};

