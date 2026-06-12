"use client";

import { useState } from "react";
import type { TenantWithPlan } from "@/app/admin/subscriptions/page";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

const PLAN_BADGE: Record<PlanId, { label: string; bg: string; color: string }> =
  {
    free: { label: "Starter", bg: "#F3F4F6", color: "#6B7280" },
    pro: { label: "Pro", bg: "#DBEAFE", color: "#1D4ED8" },
    premium: { label: "Growth", bg: "#FEF3C7", color: "#92400E" },
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
          gridTemplateColumns: "1fr 140px 160px 180px",
          padding: "12px 24px",
          borderBottom: "1px solid var(--dash-border)",
          background: "var(--dash-surface-2)",
        }}
      >
        {["Restaurante", "Slug", "Plan actual", "Acciones"].map((h) => (
          <span
            key={h}
            style={{
              color: "var(--dash-muted)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {tenants.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--dash-muted)",
          }}
        >
          No hay restaurantes todavía.
        </div>
      ) : (
        tenants.map((tenant, i) => {
          const row = rows[tenant.id];
          if (!row) return null;
          const badge = PLAN_BADGE[row.plan] ?? PLAN_BADGE.free;
          const isLast = i === tenants.length - 1;
          const isSaving = row.status === "saving";

          return (
            <div
              key={tenant.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 160px 180px",
                alignItems: "center",
                padding: "14px 24px",
                borderBottom: isLast ? "none" : "1px solid var(--dash-border)",
                background: "var(--dash-surface)",
              }}
            >
              {/* Nombre */}
              <div>
                <p
                  style={{
                    color: "var(--dash-text)",
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 2,
                  }}
                >
                  {tenant.name}
                </p>
                <p style={{ color: "var(--dash-muted)", fontSize: 12 }}>
                  {tenant.active ? "Activo" : "Inactivo"}
                </p>
              </div>

              {/* Slug */}
              <span
                style={{
                  color: "var(--dash-muted)",
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                {tenant.slug}
              </span>

              {/* Selector de plan */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {badge.label}
                </span>
                <select
                  value={row.plan}
                  disabled={isSaving}
                  onChange={(e) => setPlan(tenant.id, e.target.value as PlanId)}
                  style={{
                    fontSize: 13,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--dash-border)",
                    background: "var(--dash-surface)",
                    color: "var(--dash-text)",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.6 : 1,
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => handleSave(tenant.id)}
                  disabled={isSaving}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: isSaving
                      ? "var(--dash-surface-2)"
                      : "var(--accent)",
                    color: isSaving ? "var(--dash-muted)" : "white",
                    border: "none",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {isSaving ? "Guardando…" : "Guardar"}
                </button>

                {row.status === "saved" && (
                  <span
                    style={{ color: "#16A34A", fontSize: 13, fontWeight: 600 }}
                  >
                    Guardado
                  </span>
                )}
                {row.status === "error" && (
                  <span
                    style={{ color: "#EF4444", fontSize: 12 }}
                    title={row.errorMsg}
                  >
                    Error
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
