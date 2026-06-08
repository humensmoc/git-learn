import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "git-learn-goal-panel";

interface PanelState {
  x: number;
  y: number;
  collapsed: boolean;
}

interface FloatingPanelProps {
  title: ReactNode;
  titleExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultX?: number;
  defaultY?: number;
}

function loadState(): PanelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PanelState;
  } catch {
    return null;
  }
}

export const FloatingPanel = ({
  title,
  titleExtra,
  children,
  className,
  defaultX = 16,
  defaultY = 14,
}: FloatingPanelProps) => {
  const saved = loadState();
  const [pos, setPos] = useState({ x: saved?.x ?? defaultX, y: saved?.y ?? defaultY });
  const [collapsed, setCollapsed] = useState(saved?.collapsed ?? false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...pos, collapsed }));
  }, [pos, collapsed]);

  const clampPosition = useCallback((x: number, y: number) => {
    const parent = panelRef.current?.offsetParent as HTMLElement | null;
    const panel = panelRef.current;
    if (!parent || !panel) return { x, y };
    const maxX = Math.max(0, parent.clientWidth - panel.offsetWidth);
    const maxY = Math.max(0, parent.clientHeight - (collapsed ? 32 : panel.offsetHeight));
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y)),
    };
  }, [collapsed]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const panel = panelRef.current;
    const parent = panel?.offsetParent as HTMLElement | null;
    if (!panel || !parent) return;
    e.preventDefault();
    const parentRect = parent.getBoundingClientRect();
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - parentRect.left - pos.x,
      y: e.clientY - parentRect.top - pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const parent = panelRef.current?.offsetParent as HTMLElement | null;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const next = clampPosition(
      e.clientX - parentRect.left - dragOffset.current.x,
      e.clientY - parentRect.top - dragOffset.current.y,
    );
    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const classes = ["floating-panel", className, collapsed ? "is-collapsed" : ""].filter(Boolean).join(" ");

  return (
    <aside
      ref={panelRef}
      className={classes}
      style={{ left: pos.x, top: pos.y }}
    >
      <header
        className="floating-panel-header"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="goal-dot" aria-hidden="true" />
        <div className="floating-panel-title">{title}</div>
        <div className="floating-panel-actions">
          {titleExtra}
          <button
            type="button"
            className="floating-panel-toggle"
            aria-label={collapsed ? "展开" : "折叠"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "▾" : "▴"}
          </button>
        </div>
      </header>
      {!collapsed ? <div className="floating-panel-body">{children}</div> : null}
    </aside>
  );
};
