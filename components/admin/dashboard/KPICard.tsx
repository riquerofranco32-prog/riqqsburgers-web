"use client";

import { type LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface KPICardProps {
  label: string;
  value: string;
  change?: number | null;
  changeLabel?: string;
  sub?: string;
  icon: LucideIcon;
  loading?: boolean;
}

/**
 * Extrae el número de un string con formato ARS u otro.
 * Ej: "$12.345" → 12345, "42" → 42, "—" → null
 */
function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Reconstruye el string animado respetando el formato original.
 * Si empieza con "$", lo conserva; si no, usa el número directo.
 */
function formatAnimated(original: string, animated: number): string {
  const isCurrency = original.trimStart().startsWith("$");
  if (isCurrency) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(animated);
  }
  return String(animated);
}

function AnimatedValue({ value }: { value: string }) {
  const numeric = parseNumericValue(value);
  const isLoading = value === "…";
  const animated = useCountUp(
    numeric ?? 0,
    800,
    !isLoading,
  );

  if (isLoading || numeric === null) return <>{value}</>;
  return <>{formatAnimated(value, animated)}</>;
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  sub,
  icon: Icon,
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className="border border-dash-border rounded-2xl p-5 flex flex-col gap-3"
        style={{
          background:
            "linear-gradient(145deg, var(--dash-surface) 0%, rgba(28,33,40,0.95) 100%)",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-start justify-between">
          <div
            className="rounded-xl animate-pulse"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255,107,53,0.08)",
            }}
          />
          <div className="h-5 w-16 bg-dash-surface-2 rounded-full animate-pulse" />
        </div>
        <div className="h-2.5 w-24 bg-dash-surface-2 rounded animate-pulse mt-2" />
        <div className="h-7 w-28 bg-dash-surface-2 rounded animate-pulse" />
      </div>
    );
  }

  const isPositive = change !== null && change !== undefined && change > 0;
  const isNegative = change !== null && change !== undefined && change < 0;
  const hasChange = change !== null && change !== undefined;

  return (
    <div
      className="border border-dash-border rounded-2xl p-5 flex flex-col min-h-[128px]"
      style={{
        background:
          "linear-gradient(145deg, var(--dash-surface) 0%, rgba(28,33,40,0.95) 100%)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        transition:
          "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,107,53,0.3)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow =
          "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--dash-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)";
      }}
    >
      {/* Top row: icon bubble + change badge */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon bubble */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255,107,53,0.12)",
          }}
        >
          <Icon style={{ color: "var(--accent)", width: 18, height: 18 }} />
        </div>

        {/* Change badge */}
        {hasChange ? (
          <div
            className="flex items-center gap-1 flex-shrink-0"
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 999,
              background: isPositive
                ? "rgba(34,197,94,0.15)"
                : isNegative
                  ? "rgba(239,68,68,0.15)"
                  : "var(--dash-surface-2)",
              color: isPositive
                ? "#4ade80"
                : isNegative
                  ? "#f87171"
                  : "var(--dash-muted)",
            }}
          >
            <span>
              {isPositive ? "+" : ""}
              {(change as number).toFixed(1)}%
            </span>
            {changeLabel && (
              <span style={{ opacity: 0.6, fontSize: 10 }}>{changeLabel}</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: 13,
          color: "var(--dash-muted)",
          marginTop: 16,
          marginBottom: 4,
          lineHeight: 1,
        }}
      >
        {label}
      </p>

      {/* Value — animated */}
      <p
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "var(--dash-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontFamily: "var(--font-mono, monospace)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <AnimatedValue value={value} />
      </p>

      {/* Sub (when no change badge) */}
      {!hasChange && sub && (
        <p
          style={{
            fontSize: 11,
            color: "var(--dash-muted)",
            opacity: 0.6,
            marginTop: 4,
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
