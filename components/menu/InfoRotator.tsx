"use client";

interface InfoItem {
  icon: string;
  text: string;
}

export default function InfoRotator({
  items,
  accent = "#FF6B35",
  textColor = "var(--text-secondary, #6B5B4E)",
  maskColor = "var(--bg, #FFFAF7)",
}: {
  items: InfoItem[];
  accent?: string;
  textColor?: string;
  maskColor?: string;
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
          color: textColor,
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 13 }}>{items[0].icon}</span>
        <span>{items[0].text}</span>
      </div>
    );
  }

  // Duplicate for seamless loop: animate translateX 0 → -50%
  const doubled = [...items, ...items];
  const duration = Math.max(items.length * 2, 6);

  return (
    <div style={{ position: "relative", maxWidth: 320, overflow: "hidden" }}>
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
          background: `linear-gradient(to right, ${maskColor}, transparent)`,
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
          background: `linear-gradient(to left, ${maskColor}, transparent)`,
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
              color: textColor,
              fontWeight: 500,
              letterSpacing: "0.01em",
              padding: "0 14px",
            }}
          >
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span>{item.text}</span>
            <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 8 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
