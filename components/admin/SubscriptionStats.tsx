import { Wallet, Users, Clock, PowerOff, TrendingUp } from "lucide-react";
import type { TenantWithPlan } from "@/app/admin/subscriptions/page";
import { PLANS, type PlanId } from "@/lib/plans";

const PLAN_COLOR: Record<PlanId, string> = {
  free: "#a1a1aa",
  pro: "#63b3ed",
  premium: "#fbbf24",
};

function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function Card({
  icon: Icon,
  label,
  value,
  tone,
  trend,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: "accent" | "success" | "warning" | "muted";
  trend?: string;
}) {
  const toneColor = {
    accent: "var(--accent)",
    success: "var(--dash-success)",
    warning: "#fbbf24",
    muted: "var(--dash-muted)",
  }[tone];

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: `var(--shadow-md), 0 0 24px color-mix(in srgb, ${toneColor} 8%, transparent)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `color-mix(in srgb, ${toneColor} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${toneColor} 25%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={toneColor} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--dash-text)",
              lineHeight: 1.1,
            }}
          >
            {value}
          </span>
          {trend && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: 11,
                fontWeight: 700,
                color: "var(--dash-success)",
              }}
            >
              <TrendingUp size={11} /> {trend}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--dash-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function PlanMixBar({ tenants }: { tenants: TenantWithPlan[] }) {
  const active = tenants.filter((t) => t.active);
  if (active.length === 0) return null;

  const order: PlanId[] = ["premium", "pro", "free"];
  const counts = order.map((plan) => ({
    plan,
    count: active.filter((t) => t.plan === plan).length,
  }));

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 24,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--dash-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Mezcla de planes
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          {counts.map(({ plan, count }) => (
            <span
              key={plan}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--dash-muted)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: PLAN_COLOR[plan],
                  display: "inline-block",
                }}
              />
              {PLANS[plan].label} · {count}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 99,
          overflow: "hidden",
          background: "var(--dash-surface-2)",
        }}
      >
        {counts.map(({ plan, count }) =>
          count === 0 ? null : (
            <div
              key={plan}
              title={`${PLANS[plan].label}: ${count}`}
              style={{
                width: `${(count / active.length) * 100}%`,
                background: PLAN_COLOR[plan],
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}

export default function SubscriptionStats({
  tenants,
}: {
  tenants: TenantWithPlan[];
}) {
  const active = tenants.filter((t) => t.active);
  const mrr = active.reduce(
    (sum, t) => sum + (PLANS[t.plan as keyof typeof PLANS]?.priceArs ?? 0),
    0,
  );
  const payingTenants = active.filter((t) => t.plan !== "free");
  const paying = payingTenants.length;
  const newPayingThisMonth = payingTenants.filter(
    (t) => daysSince(t.createdAt) <= 30,
  ).length;
  const expiringSoon = active.filter((t) => {
    const d = daysLeft(t.currentPeriodEnd);
    return d !== null && d <= 7;
  }).length;
  const inactive = tenants.length - active.length;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Card
          icon={Wallet}
          label="MRR estimado"
          value={fmtARS(mrr)}
          tone="accent"
        />
        <Card
          icon={Users}
          label="Planes pagos activos"
          value={String(paying)}
          tone="success"
          trend={
            newPayingThisMonth > 0
              ? `+${newPayingThisMonth} este mes`
              : undefined
          }
        />
        <Card
          icon={Clock}
          label="Vencen en ≤7 días"
          value={String(expiringSoon)}
          tone="warning"
        />
        <Card
          icon={PowerOff}
          label="Dados de baja"
          value={String(inactive)}
          tone="muted"
        />
      </div>
      <PlanMixBar tenants={tenants} />
    </>
  );
}
