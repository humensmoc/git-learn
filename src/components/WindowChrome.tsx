import type { ReactNode } from "react";

interface WindowChromeProps {
  title: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  variant?: "light" | "dark";
  className?: string;
}

export const WindowChrome = ({
  title,
  children,
  rightSlot,
  variant = "light",
  className,
}: WindowChromeProps) => {
  const classes = ["window-chrome", `window-${variant}`, className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <header className="window-titlebar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <strong>{title}</strong>
        <div className="window-slot">{rightSlot}</div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  );
};
