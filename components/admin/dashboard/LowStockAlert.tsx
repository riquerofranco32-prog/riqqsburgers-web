"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Product } from "@/types/supabase";

interface LowStockAlertProps {
  unavailableProducts: Product[];
  slug: string;
}

export function LowStockAlert({ unavailableProducts, slug }: LowStockAlertProps) {
  const count = unavailableProducts.length;
  if (count === 0) return null;

  // Formatear nombres de los productos desactivados
  let itemsLabel = "";
  if (count === 1) {
    itemsLabel = `"${unavailableProducts[0].name}"`;
  } else if (count === 2) {
    itemsLabel = `"${unavailableProducts[0].name}" y "${unavailableProducts[1].name}"`;
  } else {
    itemsLabel = `"${unavailableProducts[0].name}", "${unavailableProducts[1].name}" y ${count - 2} más`;
  }

  const titleText = count === 1 ? "Tenés 1 producto desactivado" : `Tenés ${count} productos desactivados`;

  return (
    <div
      style={{
        background: "rgba(245, 158, 11, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: 16,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: "0 4px 24px rgba(245, 158, 11, 0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: -20,
          width: 80,
          height: 80,
          background: "rgba(245, 158, 11, 0.15)",
          filter: "blur(30px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
        {/* Pulsing Icon Container */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`
            @keyframes warning-ping {
              0% { transform: scale(0.85); opacity: 0.5; }
              70% { transform: scale(1.6); opacity: 0; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `}</style>
          <div
            style={{
              position: "absolute",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.3)",
              animation: "warning-ping 2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
            }}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <AlertTriangle
              size={15}
              style={{ color: "#f59e0b" }}
              strokeWidth={2.5}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p
            style={{
              fontSize: 13,
              color: "#fbbf24",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {titleText} en tu carta
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(251, 191, 36, 0.75)",
              lineHeight: 1.3,
            }}
          >
            Los clientes no podrán pedir <strong style={{ color: "#fbbf24", fontWeight: 600 }}>{itemsLabel}</strong> hasta que los vuelvas a activar.
          </p>
        </div>
      </div>

      <Link
        href={`/${slug}/admin/productos`}
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          padding: "8px 16px",
          borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)",
          transition: "transform 0.15s, box-shadow 0.15s",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          position: "relative",
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.2)";
        }}
      >
        Revisar stock →
      </Link>
    </div>
  );
}
