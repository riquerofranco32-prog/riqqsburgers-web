"use client";

interface InfoItem {
  icon: string;
  text: string;
}

export default function InfoRotator({
  items,
  accent = "#FF6B35",
}: {
  items: InfoItem[];
  accent?: string;
}) {
  if (!items.length) return null;
  if (items.length === 1) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          color: "rgba(255,255,255,0.85)",
          fontWeight: 500,
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ fontSize: 13 }}>{items[0].icon}</span>
        <span>{items[0].text}</span>
      </div>
    );
  }

  // Duplicate for seamless loop: animate translateX 0 → -50%
  const doubled = [...items, ...items];
  const duration = Math.max(items.length * 3, 8);

  return (
    <div style={{ position: "relative", maxWidth: 280, overflow: "hidden" }}>
      <style>{`
        @keyframes infoTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      {/* Left fade mask */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 22,
          zIndex: 1,
          background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)",
          pointerEvents: "none",
        }}
      />
      {/* Right fade mask */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 22,
          zIndex: 1,
          background: "linear-gradient(to left, rgba(0,0,0,0.5), transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: `infoTicker ${duration}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
              fontSize: 12,
              color: "rgba(255,255,255,0.88)",
              fontWeight: 500,
              letterSpacing: "0.01em",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              padding: "0 14px",
            }}
          >
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span>{item.text}</span>
            <span style={{ opacity: 0.35, fontSize: 8, marginLeft: 8 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
