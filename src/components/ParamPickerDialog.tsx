import { useEffect, useRef, useState } from "react";

interface ParamPickerDialogProps {
  open: boolean;
  title: string;
  placeholder: string;
  quickPicks?: string[];
  quickPickLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const ParamPickerDialog = ({
  open,
  title,
  placeholder,
  quickPicks = [],
  quickPickLabel = "快速选择",
  onConfirm,
  onCancel,
}: ParamPickerDialogProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <div className="text-input-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="text-input-dialog param-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="param-picker-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="param-picker-dialog-title">{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onConfirm(value.trim());
            if (e.key === "Escape") onCancel();
          }}
        />
        {quickPicks.length > 0 ? (
          <div className="param-picker-quick">
            <span className="param-picker-quick-label">{quickPickLabel}</span>
            <div className="param-picker-quick-buttons">
              {quickPicks.map((pick) => (
                <button key={pick} type="button" className="param-picker-chip" onClick={() => onConfirm(pick)}>
                  {pick}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="text-input-dialog-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button type="button" onClick={() => value.trim() && onConfirm(value.trim())} disabled={!value.trim()}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
