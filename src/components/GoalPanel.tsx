import type { LessonStep, LessonWorld, RiskLevel } from "../lessons/types";
import { FloatingPanel } from "./FloatingPanel";

const riskLabel: Record<RiskLevel, string> = {
  basic: "基础",
  advanced: "进阶",
  danger: "危险",
};

export interface LessonGoalPanelProps {
  world: LessonWorld;
  worldIndex: number;
  totalWorlds: number;
  stepIndex: number;
  step: LessonStep;
  checkpointStatus: Array<{ id: string; title: string; done: boolean }>;
  awaitingStepConfirm: boolean;
  worldCompleted: boolean;
  feedback: string[];
  onSelectWorld: (index: number) => void;
  onConfirmStep: () => void;
  onHint: () => void;
}

export const LessonGoalPanel = ({
  world,
  worldIndex,
  totalWorlds,
  stepIndex,
  step,
  checkpointStatus,
  awaitingStepConfirm,
  worldCompleted,
  feedback,
  onSelectWorld,
  onConfirmStep,
  onHint,
}: LessonGoalPanelProps) => (
  <FloatingPanel
    className="goal-panel"
    title={
      <>
        <strong>目标</strong>
        <span className="goal-world-title">{world.title}</span>
        <em className="goal-mode-tag">{world.mode.toUpperCase()}</em>
      </>
    }
    titleExtra={
      <button type="button" className="goal-hint-btn" onClick={onHint}>
        提示
      </button>
    }
  >
    <p className="goal-description">{world.description}</p>
    <p className="goal-progress">
      进度：Step {stepIndex + 1} / {world.steps.length}
    </p>
    <div className="goal-step-meta">
      <h4>{step.title}</h4>
      {step.riskLevel ? <span className={`risk-badge risk-${step.riskLevel}`}>{riskLabel[step.riskLevel]}</span> : null}
    </div>
    <p>{step.instruction}</p>
    <code>{step.commandHint}</code>
    {checkpointStatus.length > 0 ? (
      <div className="goal-checkpoints">
        {checkpointStatus.map((item) => (
          <div key={item.id} className={`goal-checkpoint-item${item.done ? " is-done" : ""}`}>
            <span className="goal-checkpoint-mark">{item.done ? "✓" : "○"}</span>
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    ) : null}
    {awaitingStepConfirm ? (
      <button type="button" className="goal-confirm-btn" onClick={onConfirmStep}>
        完成本步骤
      </button>
    ) : null}
    {step.riskNote ? <p className="goal-risk-note">{step.riskNote}</p> : null}
    {feedback.length > 0 ? (
      <div className="goal-feedback" aria-live="polite">
        {feedback.map((line, idx) => (
          <p key={`${line}-${idx}`}>{line}</p>
        ))}
      </div>
    ) : null}
    <small>也可在终端输入 hint 查看提示</small>
    {!worldCompleted ? <small>当前关卡未完成，暂时不能进入下一关。</small> : null}
    <div className="goal-world-switch">
      <button type="button" onClick={() => onSelectWorld(Math.max(0, worldIndex - 1))}>
        上一关
      </button>
      <span>
        {worldIndex + 1} / {totalWorlds}
      </span>
      <button type="button" onClick={() => onSelectWorld(Math.min(totalWorlds - 1, worldIndex + 1))}>
        下一关
      </button>
    </div>
  </FloatingPanel>
);
