import type { LessonWorld, RiskLevel } from "../lessons/types";

const riskLabel: Record<RiskLevel, string> = {
  basic: "基础",
  advanced: "进阶",
  danger: "危险",
};

interface LessonPanelProps {
  world: LessonWorld;
  worldIndex: number;
  totalWorlds: number;
  stepIndex: number;
  onSelectWorld: (index: number) => void;
  onHint: () => void;
  onToggleGoal: () => void;
  goalVisible: boolean;
  feedback: string[];
}

export const LessonPanel = ({
  world,
  worldIndex,
  totalWorlds,
  stepIndex,
  onSelectWorld,
  onHint,
  onToggleGoal,
  goalVisible,
  feedback,
}: LessonPanelProps) => {
  const step = world.steps[stepIndex];
  return (
    <section className="lesson-panel">
      <div className="lesson-actionbar">
        <div className="lesson-actionbar-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.5 2 4 13h6.1L8.8 22 20 9.3h-6L13.5 2Z" />
          </svg>
          <span>{world.title}</span>
          <em>{world.mode.toUpperCase()}</em>
        </div>
        <div className="lesson-actionbar-buttons">
          <button type="button" onClick={onToggleGoal}>
            {goalVisible ? "隐藏目标" : "显示目标"}
          </button>
          <button type="button" onClick={onHint}>
            提示
          </button>
        </div>
      </div>
      <p className="lesson-description">{world.description}</p>
      <p className="lesson-progress">
        进度：Step {stepIndex + 1} / {world.steps.length}
      </p>
      <div className="lesson-step-meta">
        <h3>{step.title}</h3>
        {step.riskLevel ? <span className={`risk-badge risk-${step.riskLevel}`}>{riskLabel[step.riskLevel]}</span> : null}
      </div>
      <p>{step.instruction}</p>
      <code>{step.commandHint}</code>
      {step.riskNote ? <p className="lesson-risk-note">{step.riskNote}</p> : null}
      {feedback.length > 0 ? (
        <div className="lesson-feedback" aria-live="polite">
          {feedback.map((line, idx) => (
            <p key={`${line}-${idx}`}>{line}</p>
          ))}
        </div>
      ) : null}
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

