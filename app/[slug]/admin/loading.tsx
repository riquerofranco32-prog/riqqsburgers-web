function Bar({ width, height = 14 }: { width: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: "var(--dash-surface-2)",
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <Bar width="120px" height={12} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Bar width="220px" height={22} />
        <Bar width="320px" height={13} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 64,
              borderRadius: 14,
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
