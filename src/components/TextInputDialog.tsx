import { useEffect, useRef, useState } from "react";

interface TextInputDialogProps {
  open: boolean;
  title: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const TextInputDialog = ({ open, title, placeholder, onConfirm, onCancel }: TextInputDialogProps) => {
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
        className="text-input-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-input-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="text-input-dialog-title">{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value);
            if (e.key === "Escape") onCancel();
          }}
        />
        <div className="text-input-dialog-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button type="button" onClick={() => onConfirm(value)}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
