import { useEffect } from "react";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const HelpDialog = ({ open, onClose }: HelpDialogProps) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="text-input-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="text-input-dialog help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="help-dialog-title">使用说明</h3>
        <div className="help-dialog-body">
          <section>
            <h4>模式</h4>
            <p>
              <strong>自由沙盒</strong>：随意练习 Git 命令，可切换 Sim / Real 引擎并重置仓库。
              <strong>课程模式</strong>：按关卡引导学习，系统自动校验步骤并保存进度。
            </p>
          </section>
          <section>
            <h4>左栏</h4>
            <ul>
              <li>
                <strong>终端</strong>：输入 Git 命令；点击「快捷」打开命令快捷坞。
              </li>
              <li>
                <strong>文件状态</strong>：查看工作区与暂存区，可点击文件进行操作。
              </li>
            </ul>
          </section>
          <section>
            <h4>右栏</h4>
            <ul>
              <li>
                <strong>Graph View</strong>：提交与分支的可视化图谱，命令执行后自动更新。
              </li>
              <li>
                <strong>目标浮层</strong>（课程模式）：显示当前步骤目标，可拖动与隐藏。
              </li>
            </ul>
          </section>
          <section>
            <h4>终端技巧</h4>
            <ul>
              <li>
                <strong>Tab</strong>：命令补全
              </li>
              <li>
                <strong>↑ / ↓</strong>：浏览命令历史
              </li>
            </ul>
          </section>
          <section>
            <h4>内置命令（课程模式）</h4>
            <ul>
              <li>
                <code>hint</code> — 显示当前步骤提示
              </li>
              <li>
                <code>levels</code> — 列出全部关卡
              </li>
              <li>
                <code>reset</code> — 重置当前关卡仓库
              </li>
            </ul>
          </section>
        </div>
        <div className="text-input-dialog-actions">
          <button type="button" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
