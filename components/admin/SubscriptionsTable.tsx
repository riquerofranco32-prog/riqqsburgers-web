"use client";

import { useState } from "react";
import { Search, X, SearchX, Building2, Power, PowerOff } from "lucide-react";
import type { TenantWithPlan } from "@/app/admin/subscriptions/page";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import EmptyState from "@/components/admin/EmptyState";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";

// ── Plan badge design system ────────────────────────────────────────────────

const PLAN_BADGE: Record<
  PlanId,
  {
    label: string;
    bg: string;
    color: string;
    border: string;
    glow: string;
    icon: string;
  }
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
  periodEnd: string; // yyyy-mm-dd para <input type="date">, "" = sin vencimiento
  active: boolean;
  status: RowState;
  errorMsg: string;
  togglingActive: boolean;
  confirmingDeactivate: boolean;
}

// current_period_end (ISO con hora) -> yyyy-mm-dd para el input date
function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function isPlanId(value: string): value is PlanId {
  return VALID_PLANS.includes(value as PlanId);
}

// Días hasta el vencimiento (negativo = ya venció, null = sin fecha)
function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

type FilterId = "all" | PlanId | "expiring" | "inactive";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "free", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "premium", label: "Growth" },
  { id: "expiring", label: "Vencen ≤7 días" },
  { id: "inactive", label: "Inactivos" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
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
        color: active ? "var(--dash-success)" : "var(--dash-muted)",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "var(--dash-success)" : "var(--dash-border)",
          boxShadow: active ? "0 0 6px var(--dash-success-border)" : "none",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {active ? "Activo" : "Dado de baja"}
    </span>
  );
}

function Avatar({ name, active }: { name: string; active: boolean }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: active
          ? "linear-gradient(135deg, var(--dash-accent-subtle), var(--dash-surface-3))"
          : "var(--dash-surface-2)",
        border: `1px solid ${active ? "var(--dash-accent-glow)" : "var(--dash-border)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        color: active ? "var(--accent)" : "var(--dash-muted)",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials(name)}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function SubscriptionsTable({
  tenants,
}: {
  tenants: TenantWithPlan[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [rows, setRows] = useState<Record<string, RowData>>(() => {
    const init: Record<string, RowData> = {};
    for (const t of tenants) {
      const plan = isPlanId(t.plan) ? t.plan : "free";
      init[t.id] = {
        plan,
        periodEnd: toDateInputValue(t.currentPeriodEnd),
        active: !!t.active,
        status: "idle",
        errorMsg: "",
        togglingActive: false,
        confirmingDeactivate: false,
      };
    }
    return init;
  });

  const q = search.trim().toLowerCase();
  const filtered = tenants.filter((t) => {
    if (
      q &&
      !t.name.toLowerCase().includes(q) &&
      !t.slug.toLowerCase().includes(q)
    )
      return false;
    if (filter === "all") return true;
    if (filter === "inactive") return !t.active;
    if (filter === "expiring") {
      const d = daysLeft(t.currentPeriodEnd);
      return t.active && d !== null && d <= 7;
    }
    return t.plan === filter;
  });

  function setPlan(tenantId: string, plan: PlanId) {
    setRows((prev) => ({
      ...prev,
      [tenantId]: { ...prev[tenantId], plan, status: "idle", errorMsg: "" },
    }));
  }

  function setPeriodEnd(tenantId: string, periodEnd: string) {
    setRows((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        periodEnd,
        status: "idle",
        errorMsg: "",
      },
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
        body: JSON.stringify({
          plan: row.plan,
          periodEnd: row.periodEnd || null,
        }),
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

  async function handleToggleActive(tenantId: string, nextActive: boolean) {
    setRows((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        togglingActive: true,
        confirmingDeactivate: false,
      },
    }));
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) throw new Error();
      setRows((prev) => ({
        ...prev,
        [tenantId]: {
          ...prev[tenantId],
          active: nextActive,
          togglingActive: false,
        },
      }));
    } catch {
      setRows((prev) => ({
        ...prev,
        [tenantId]: { ...prev[tenantId], togglingActive: false },
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
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Búsqueda */}
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid var(--dash-border)",
          background: "var(--dash-surface-2)",
        }}
      >
        <div style={{ position: "relative", maxWidth: 320 }}>
          <Search
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--dash-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o slug..."
            style={{
              width: "100%",
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 8,
              paddingLeft: 30,
              paddingRight: search ? 30 : 10,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13,
              color: "var(--dash-text)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--dash-muted)",
                display: "flex",
                padding: 0,
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Chips de filtro */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
          }}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  border: `1px solid ${isActive ? "var(--dash-accent-glow)" : "var(--dash-border)"}`,
                  background: isActive
                    ? "linear-gradient(135deg, var(--accent), #ff8c5a)"
                    : "var(--dash-surface)",
                  color: isActive ? "#fff" : "var(--dash-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 130px 170px 150px 260px",
          padding: "12px 24px",
          borderBottom: "1px solid var(--dash-border)",
          background: "var(--dash-surface-2)",
          gap: 8,
        }}
      >
        {["Restaurante", "Slug", "Plan actual", "Vencimiento", "Acciones"].map(
          (h) => (
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
          ),
        )}
      </div>

      {/* Empty states */}
      {tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hay restaurantes todavía"
          description="Los negocios que se sumen a Takefyy van a aparecer acá."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description={
            q
              ? `No encontramos restaurantes para "${search}".`
              : "Ningún restaurante coincide con este filtro."
          }
          action={{
            label: "Limpiar filtros",
            onClick: () => {
              setSearch("");
              setFilter("all");
            },
          }}
        />
      ) : (
        filtered.map((tenant, i) => {
          const row = rows[tenant.id];
          if (!row) return null;
          const isLast = i === filtered.length - 1;
          const isSaving = row.status === "saving";
          const isSaved = row.status === "saved";
          const isError = row.status === "error";
          const daysUntilExpiry = row.active
            ? daysLeft(tenant.currentPeriodEnd)
            : null;
          const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
          const isExpiringSoon =
            daysUntilExpiry !== null &&
            daysUntilExpiry >= 0 &&
            daysUntilExpiry <= 7;

          return (
            <div
              key={tenant.id}
              className="order-row-trigger"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 170px 150px 260px",
                alignItems: "center",
                padding: "16px 24px",
                gap: 8,
                borderBottom: isLast ? "none" : "1px solid var(--dash-border)",
                borderLeft: isExpired
                  ? "3px solid var(--dash-danger)"
                  : isExpiringSoon
                    ? "3px solid #fbbf24"
                    : "3px solid transparent",
                opacity: row.active ? 1 : 0.7,
              }}
            >
              {/* Avatar + nombre + estado */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={tenant.name} active={row.active} />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
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
                  <StatusIndicator active={row.active} />
                </div>
              </div>

              {/* Slug */}
              <span
                style={{
                  color: "var(--dash-muted)",
                  fontSize: 12,
                  fontFamily: "monospace",
                  background: "var(--dash-surface-2)",
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <PlanBadge plan={row.plan} />
                <select
                  value={row.plan}
                  disabled={isSaving || !row.active}
                  onChange={(e) => setPlan(tenant.id, e.target.value as PlanId)}
                  style={{
                    fontSize: 12,
                    padding: "5px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--dash-border)",
                    background: "var(--dash-surface-2)",
                    color: "var(--dash-text)",
                    cursor: isSaving || !row.active ? "not-allowed" : "pointer",
                    opacity: isSaving || !row.active ? 0.5 : 1,
                    outline: "none",
                  }}
                >
                  {VALID_PLANS.map((p) => (
                    <option key={p} value={p}>
                      {PLANS[p].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vencimiento manual (opcional, ej: plan pago fuera de MP) */}
              <input
                type="date"
                value={row.periodEnd}
                disabled={isSaving || !row.active}
                onChange={(e) => setPeriodEnd(tenant.id, e.target.value)}
                title="Fecha de vencimiento del plan (vacío = sin vencimiento)"
                style={{
                  fontSize: 12,
                  padding: "5px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--dash-border)",
                  background: "var(--dash-surface-2)",
                  color: "var(--dash-text)",
                  cursor: isSaving || !row.active ? "not-allowed" : "text",
                  opacity: isSaving || !row.active ? 0.5 : 1,
                  outline: "none",
                  width: "100%",
                }}
              />

              {/* Acciones */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => handleSave(tenant.id)}
                  disabled={isSaving || !row.active}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      isSaving || !row.active
                        ? "var(--dash-surface-2)"
                        : "linear-gradient(135deg, var(--accent), #ff8c5a)",
                    color:
                      isSaving || !row.active ? "var(--dash-muted)" : "#fff",
                    border: "none",
                    cursor: isSaving || !row.active ? "not-allowed" : "pointer",
                    boxShadow:
                      isSaving || !row.active
                        ? "none"
                        : "0 2px 8px var(--dash-accent-glow)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSaving ? "Guardando…" : "Guardar"}
                </button>

                {isSaved && (
                  <span
                    style={{
                      color: "var(--dash-success)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓ Guardado
                  </span>
                )}
                {isError && (
                  <span
                    title={row.errorMsg}
                    style={{
                      color: "var(--dash-danger)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "help",
                    }}
                  >
                    ⚠ Error
                  </span>
                )}

                <InlineConfirm
                  active={row.confirmingDeactivate}
                  itemKey={tenant.id}
                  confirm={
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() =>
                          void handleToggleActive(tenant.id, false)
                        }
                        disabled={row.togglingActive}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          background: "var(--dash-danger)",
                          color: "#fff",
                          border: "none",
                          cursor: row.togglingActive
                            ? "not-allowed"
                            : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.togglingActive
                          ? "Dando de baja…"
                          : "Sí, dar de baja"}
                      </button>
                      <button
                        onClick={() =>
                          setRows((prev) => ({
                            ...prev,
                            [tenant.id]: {
                              ...prev[tenant.id],
                              confirmingDeactivate: false,
                            },
                          }))
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "var(--dash-surface-2)",
                          color: "var(--dash-muted)",
                          border: "1px solid var(--dash-border)",
                          cursor: "pointer",
                        }}
                      >
                        No
                      </button>
                    </div>
                  }
                  trigger={
                    row.active ? (
                      <button
                        onClick={() =>
                          setRows((prev) => ({
                            ...prev,
                            [tenant.id]: {
                              ...prev[tenant.id],
                              confirmingDeactivate: true,
                            },
                          }))
                        }
                        title="Dar de baja este negocio"
                        aria-label={`Dar de baja ${tenant.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 12px",
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "var(--dash-danger-bg)",
                          color: "var(--dash-danger)",
                          border: "1px solid var(--dash-danger-border)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <PowerOff size={13} /> Dar de baja
                      </button>
                    ) : (
                      <button
                        onClick={() => void handleToggleActive(tenant.id, true)}
                        disabled={row.togglingActive}
                        title="Reactivar este negocio"
                        aria-label={`Reactivar ${tenant.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "7px 12px",
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "var(--dash-success-bg)",
                          color: "var(--dash-success)",
                          border: "1px solid var(--dash-success-border)",
                          cursor: row.togglingActive
                            ? "not-allowed"
                            : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Power size={13} />
                        {row.togglingActive ? "Reactivando…" : "Reactivar"}
                      </button>
                    )
                  }
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
