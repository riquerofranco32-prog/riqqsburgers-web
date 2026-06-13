"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface LowStockAlertProps {
  unavailableCount: number;
  slug: string;
}

export function LowStockAlert({ unavailableCount, slug }: LowStockAlertProps) {
  if (unavailableCount === 0) return null;

  const label =
    unavailableCount === 1
      ? "1 producto desactivado"
      : `${unavailableCount} productos desactivados`;

  return (
    <div
      style={{
        background: "rgba(245,158,11,0.1)",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <AlertTriangle
        size={16}
        style={{ color: "#f59e0b", flexShrink: 0 }}
        strokeWidth={2}
      />
      <p
        style={{
          fontSize: 13,
          color: "#fbbf24",
          flex: 1,
          minWidth: 0,
        }}
      >
        Tenés <strong style={{ fontWeight: 700 }}>{label}</strong> en tu carta —
        los clientes no pueden pedirlos.
      </p>
      <Link
        href={`/${slug}/admin/productos`}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#f59e0b",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        Revisar productos →
      </Link>
    </div>
  );
}
