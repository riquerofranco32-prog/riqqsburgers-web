"use client";

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`toggle-track ${checked ? "on" : ""}`}
      style={{ background: checked ? "var(--accent)" : "var(--dash-border)" }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div className="toggle-thumb" />
    </div>
  );
}
