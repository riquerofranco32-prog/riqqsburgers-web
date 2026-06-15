"use client";

import { useState } from "react";
import type { TenantWithPlan } from "@/app/admin/subscriptions/page";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

// ── Plan badge design system ────────────────────────────────────────────────

const PLAN_BADGE: Record<
  PlanId,
  { label: string; bg: string; color: string; border: string; glow: string; icon: string }
> = {
  free: {
    label: "Starter",
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
    border: "rgba(113,113,122,0.25)",
    glow: "rgba(113,113,122,0.15)",
    icon: "⚡",
  },
  pro: {
    label: "Pro",
    bg: "rgba(99,179,237,0.12)",
    color: "#63b3ed",
    border: "rgba(99,179,237,0.25)",
    glow: "rgba(99,179,237,0.2)",
    icon: "🚀",
  },
  premium: {
    label: "Growth",
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.25)",
    glow: "rgba(251,191,36,0.2)",
    icon: "👑",
  },
};

const VALID_PLANS: PlanId[] = ["free", "pro", "premium"];

type RowState = "idle" | "saving" | "saved" | "error";

interface RowData {
  plan: PlanId;
  status: RowState;
  errorMsg: string;
}

function isPlanId(value: string): value is PlanId {
  return VALID_PLANS.includes(value as PlanId);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: PlanId }) {
  const b = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: b.bg,
        color: b.color,
        border: `1px solid ${b.border}`,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        boxShadow: `0 0 10px ${b.glow}`,
        whiteSpace: "nowrap",
      }}
    >
      {b.icon} {b.label}
    </span>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        color: active ? "#4ade80" : "#71717a",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#4ade80" : "#52525b",
          boxShadow: active ? "0 0 6px rgba(74,222,128,0.6)" : "none",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function SubscriptionsTable({
  tenants,
}: {
  tenants: TenantWithPlan[];
}) {
  const [rows, setRows] = useState<Record<string, RowData>>(() => {
    const init: Record<string, RowData> = {};
    for (const t of tenants) {
      const plan = isPlanId(t.plan) ? t.plan : "free";
      init[t.id] = { plan, status: "idle", errorMsg: "" };
    }
    return init;
  });

  function setPlan(tenantId: string, plan: PlanId) {
    setRows((prev) => ({
      ...prev,
      [tenantId]: { ...prev[tenantId], plan, status: "idle", errorMsg: "" },
    }));
  }

  async function handleSave(tenantId: string) {
    const row = rows[tenantId];
    if (!row) return;

    setRows((prev) => ({
      ...prev,
      [tenantId]: { ...prev[tenantId], status: "saving", errorMsg: "" },
    }));

    try {
      const res = await fetch(`/api/admin/subscriptions/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: row.plan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      setRows((prev) => ({
        ...prev,
        [tenantId]: { ...prev[tenantId], status: "saved" },
      }));
      setTimeout(() => {
        setRows((prev) => ({
          ...prev,
          [tenantId]: { ...prev[tenantId], status: "idle" },
        }));
      }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setRows((prev) => ({
        ...prev,
        [tenantId]: { ...prev[tenantId], status: "error", errorMsg: msg },
      }));
    }
  }

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 130px 170px 200px",
          padding: "12px 24px",
          borderBottom: "1px solid var(--dash-border)",
          background: "var(--dash-surface-2)",
          gap: 8,
        }}
      >
        {["Restaurante", "Slug", "Plan actual", "Acciones"].map((h) => (
          <span
            key={h}
            style={{
              color: "var(--dash-muted)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Empty state */}
      {tenants.length === 0 ? (
        <div
          style={{
            padding: "64px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 32 }}>🏪</span>
          <p style={{ color: "var(--dash-muted)", fontSize: 14 }}>
            No hay restaurantes todavía.
          </p>
        </div>
      ) : (
        tenants.map((tenant, i) => {
          const row = rows[tenant.id];
          if (!row) return null;
          const isLast = i === tenants.length - 1;
          const isSaving = row.status === "saving";
          const isSaved = row.status === "saved";
          const isError = row.status === "error";

          return (
            <div
              key={tenant.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 170px 200px",
                alignItems: "center",
                padding: "16px 24px",
                gap: 8,
                borderBottom: isLast ? "none" : "1px solid var(--dash-border)",
                background: "var(--dash-surface)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--dash-surface)";
              }}
            >
              {/* Nombre + estado */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span
                  style={{
                    color: "var(--dash-text)",
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1.2,
                  }}
                >
                  {tenant.name}
                </span>
                <StatusIndicator active={!!tenant.active} />
              </div>

              {/* Slug */}
              <span
                style={{
                  color: "var(--dash-muted)",
                  fontSize: 12,
                  fontFamily: "monospace",
                  background: "rgba(255,255,255,0.04)",
                  padding: "2px 7px",
                  borderRadius: 6,
                  border: "1px solid var(--dash-border)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {tenant.slug}
              </span>

              {/* Selector de plan */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <PlanBadge plan={row.plan} />
                <select
                  value={row.plan}
                  disabled={isSaving}
                  onChange={(e) => setPlan(tenant.id, e.target.value as PlanId)}
                  style={{
                    fontSize: 12,
                    padding: "5px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--dash-border)",
                    background: "var(--dash-surface-2)",
                    color: "var(--dash-text)",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.5 : 1,
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,107,53,0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--dash-border)";
                  }}
                >
                  {VALID_PLANS.map((p) => (
                    <option key={p} value={p}>
                      {PLANS[p].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => handleSave(tenant.id)}
                  disabled={isSaving}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isSaving
                      ? "var(--dash-surface-2)"
                      : "linear-gradient(135deg, var(--accent), #ff8c5a)",
                    color: isSaving ? "var(--dash-muted)" : "#fff",
                    border: "none",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    boxShadow: isSaving
                      ? "none"
                      : "0 2px 8px rgba(255,107,53,0.25)",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 5px 14px rgba(255,107,53,0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = isSaving
                      ? "none"
                      : "0 2px 8px rgba(255,107,53,0.25)";
                  }}
                >
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ animation: "spin 0.7s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Guardando…
                    </span>
                  ) : (
                    "Guardar"
                  )}
                </button>

                {isSaved && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#4ade80",
                      fontSize: 12,
                      fontWeight: 700,
                      animation: "fade-in 0.3s ease",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Guardado
                  </span>
                )}

                {isError && (
                  <span
                    title={row.errorMsg}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#f87171",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "help",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Error
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
