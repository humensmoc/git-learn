import type { LessonStep, RiskLevel } from "../lessons/types";

interface GoalPanelProps {
  step: LessonStep;
}

const riskLabel: Record<RiskLevel, string> = {
  basic: "基础",
  advanced: "进阶",
  danger: "危险",
};

export const GoalPanel = ({ step }: GoalPanelProps) => {
  return (
    <aside className="goal-panel">
      <header className="goal-panel-header">
        <span className="goal-dot" aria-hidden="true" />
        <strong>目标</strong>
        {step.riskLevel ? <span className={`risk-badge risk-${step.riskLevel}`}>{riskLabel[step.riskLevel]}</span> : null}
      </header>
      <div className="goal-panel-body">
        <h4>{step.title}</h4>
        <p>{step.instruction}</p>
        <code>{step.commandHint}</code>
        {step.riskNote ? <p className="goal-risk-note">{step.riskNote}</p> : null}
        <small>也可在终端输入 hint 查看提示</small>
      </div>
    </aside>
  );
};
