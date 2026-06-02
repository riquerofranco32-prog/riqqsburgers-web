"use client";

export default function PrintButton({
  label = "Imprimir",
  fullWidth = false,
}: {
  label?: string;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
        background: "#111",
        color: "white",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        flexShrink: 0,
        width: fullWidth ? "100%" : undefined,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
