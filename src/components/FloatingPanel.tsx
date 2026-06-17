import type { ReactNode } from "react";

type FloatingPanelProps = {
  title: string;
  children: ReactNode;
  variant?: "default" | "accent" | "subtle";
  onClose?: () => void;
  className?: string;
};

function FloatingPanel({
  title,
  children,
  variant = "default",
  onClose,
  className
}: FloatingPanelProps) {
  return (
    <section
      className={`floating-panel floating-panel--${variant}${className ? ` ${className}` : ""}`}
    >
      <div className="floating-panel__header">
        <span className="floating-panel__title">{title}</span>
        {onClose ? (
          <button
            type="button"
            className="floating-panel__close"
            onClick={onClose}
            aria-label={`Fechar painel ${title}`}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="floating-panel__body">{children}</div>
    </section>
  );
}

export default FloatingPanel;
