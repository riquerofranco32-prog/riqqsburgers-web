export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#111",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero skeleton */}
      <div
        style={{
          height: "clamp(200px, 30vw, 360px)",
          background:
            "linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          padding: "24px 16px",
        }}
      >
        {/* Category pills skeleton */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 28,
            overflowX: "hidden",
          }}
        >
          {[90, 110, 80, 120, 95].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 36,
                borderRadius: 999,
                background: "#1e1e1e",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Product cards skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 16,
                background: "#1a1a1a",
                display: "flex",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    height: 16,
                    width: "60%",
                    borderRadius: 8,
                    background: "#252525",
                  }}
                />
                <div
                  style={{
                    height: 12,
                    width: "80%",
                    borderRadius: 8,
                    background: "#222",
                  }}
                />
                <div
                  style={{
                    height: 14,
                    width: "30%",
                    borderRadius: 8,
                    background: "#252525",
                  }}
                />
              </div>
              <div
                style={{ width: 90, background: "#1e1e1e", flexShrink: 0 }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
