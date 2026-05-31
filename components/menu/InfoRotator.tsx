"use client";

import { useState, useEffect, useRef } from "react";

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
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goTo(next: number) {
    if (next === current) return;
    setPhase("exit");
    timerRef.current = setTimeout(() => {
      setCurrent(next);
      setPhase("enter");
      timerRef.current = setTimeout(() => setPhase("visible"), 20);
    }, 260);
  }

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % items.length;
        setPhase("exit");
        timerRef.current = setTimeout(() => {
          setCurrent(next);
          setPhase("enter");
          timerRef.current = setTimeout(() => setPhase("visible"), 20);
        }, 260);
        return prev;
      });
    }, 3200);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items.length]);

  if (!items.length) return null;

  const item = items[current];

  const transform =
    phase === "exit"
      ? "translateX(-18px)"
      : phase === "enter"
        ? "translateX(18px)"
        : "translateX(0)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Sliding text */}
      <div style={{ overflow: "hidden", maxWidth: 260 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "rgba(255,255,255,0.88)",
            fontWeight: 500,
            letterSpacing: "0.01em",
            transition:
              phase === "enter"
                ? "none"
                : "opacity 0.26s ease, transform 0.26s ease",
            opacity: phase === "visible" ? 1 : 0,
            transform,
            minHeight: 24,
            textShadow: "0 1px 4px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 14 }}>{item.icon}</span>
          <span>{item.text}</span>
        </div>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 16 : 5,
                height: 5,
                borderRadius: 999,
                background:
                  i === current
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
