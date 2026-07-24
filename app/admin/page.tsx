import Link from "next/link";
import { getAllTenantsWithStats } from "@/lib/tenants";
import { getPlanLimits, type PlanId } from "@/lib/plans";
import SuperAdminKPIGrid from "@/components/admin/SuperAdminKPIGrid";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  premium: "Growth",
};

const PLAN_COLOR: Record<PlanId, string> = {
  free: "#a1a1aa",
  pro: "#63b3ed",
  premium: "#fbbf24",
};

const RENEWAL_WINDOW_DAYS = 7;

export default async function SuperAdminDashboardPage() {
  const tenants = await getAllTenantsWithStats();

  const activeTenants = tenants.filter((t) => t.active);

  const mrr = activeTenants
    .filter((t) => t.plan !== "free" && t.subscriptionStatus !== "expired")
    .reduce((sum, t) => sum + getPlanLimits(t.plan as PlanId).priceArs, 0);

  const totalOrders = tenants.reduce((sum, t) => sum + t.orderCount, 0);

  const planCounts = activeTenants.reduce(
    (acc, t) => {
      acc[t.plan] = (acc[t.plan] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const renewingSoon = activeTenants
    .filter(
      (t) => t.trialDaysLeft !== null && t.trialDaysLeft <= RENEWAL_WINDOW_DAYS,
    )
    .sort((a, b) => (a.trialDaysLeft ?? 0) - (b.trialDaysLeft ?? 0));

  return (
    <div style={{ padding: "24px 32px" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "var(--dash-text)",
          marginBottom: 4,
        }}
      >
        Dashboard
      </h1>
      <p style={{ fontSize: 14, color: "var(--dash-muted)", marginBottom: 24 }}>
        Vista global de todos los restaurantes
      </p>

      <SuperAdminKPIGrid
        activeTenantsCount={activeTenants.length}
        mrr={mrr}
        totalOrders={totalOrders}
        renewingSoonCount={renewingSoon.length}
        renewalWindowDays={RENEWAL_WINDOW_DAYS}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid var(--dash-border)",
            borderRadius: 16,
            padding: 20,
            background: "var(--dash-surface)",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--dash-text)",
              marginBottom: 14,
            }}
          >
            Planes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(["premium", "pro", "free"] as PlanId[]).map((plan) => {
              const count = planCounts[plan] ?? 0;
              const pct = activeTenants.length
                ? (count / activeTenants.length) * 100
                : 0;
              return (
                <div key={plan}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "var(--dash-muted)",
                      marginBottom: 4,
                    }}
                  >
                    <span>{PLAN_LABELS[plan]}</span>
                    <span
                      style={{ color: "var(--dash-text)", fontWeight: 600 }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background: "var(--dash-surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: PLAN_COLOR[plan],
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--dash-border)",
            borderRadius: 16,
            padding: 20,
            background: "var(--dash-surface)",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--dash-text)",
              marginBottom: 14,
            }}
          >
            Vencen pronto
          </h2>
          {renewingSoon.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>
              Nadie vence en los próximos {RENEWAL_WINDOW_DAYS} días.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {renewingSoon.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    paddingLeft: 10,
                    borderLeft: `3px solid ${
                      (t.trialDaysLeft ?? 0) <= 3
                        ? "var(--dash-danger)"
                        : "#fbbf24"
                    }`,
                  }}
                >
                  <span style={{ color: "var(--dash-text)" }}>{t.name}</span>
                  <span
                    style={{
                      color:
                        (t.trialDaysLeft ?? 0) <= 3
                          ? "var(--dash-danger)"
                          : "var(--dash-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {t.trialDaysLeft === 0
                      ? "hoy"
                      : `${t.trialDaysLeft} día${t.trialDaysLeft === 1 ? "" : "s"}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/subscriptions"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Gestionar suscripciones →
          </Link>
        </div>
      </div>
    </div>
  );
}
