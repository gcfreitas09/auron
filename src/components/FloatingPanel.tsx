import type { ReactNode } from "react";

type FloatingPanelProps = {
  title: string;
  children: ReactNode;
  tone?: "default" | "accent";
};

function FloatingPanel({
  title,
  children,
  tone = "default"
}: FloatingPanelProps) {
  return (
    <section className={`floating-panel floating-panel--${tone}`}>
      <span className="floating-panel__title">{title}</span>
      <div className="floating-panel__body">{children}</div>
    </section>
  );
}

export default FloatingPanel;
