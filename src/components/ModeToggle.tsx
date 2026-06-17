type ModeToggleProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

function ModeToggle({ label, onClick, className }: ModeToggleProps) {
  return (
    <button
      type="button"
      className={`mode-toggle${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default ModeToggle;
