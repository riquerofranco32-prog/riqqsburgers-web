"use client";

import { CheckCircle2 } from "lucide-react";

export default function AddedToast({
  visible,
  name,
  hasCart,
}: {
  visible: boolean;
  name: string;
  hasCart?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: hasCart ? 120 : 90,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        background: "#111",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 24,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 100,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <CheckCircle2 size={13} strokeWidth={2.5} style={{ marginRight: 4 }} />
      {name ? name.split(" ")[0] : "Producto"} agregado
    </div>
  );
}
