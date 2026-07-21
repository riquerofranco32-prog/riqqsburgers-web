import { createServerClient } from "@/lib/supabase";
import SubscriptionsTable from "@/components/admin/SubscriptionsTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suscripciones — Takefyy Admin" };

export type TenantWithPlan = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  active: boolean;
  currentPeriodEnd: string | null;
};

async function getTenantsWithPlan(): Promise<TenantWithPlan[]> {
  const supabase = createServerClient();
  const [{ data, error }, { data: subs }] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, slug, name, plan, active")
      .order("name", { ascending: true }),
    supabase.from("subscriptions").select("tenant_id, current_period_end"),
  ]);
  if (error || !data) return [];
  const periodEndByTenant = new Map(
    (subs ?? []).map((s) => [
      s.tenant_id,
      s.current_period_end as string | null,
    ]),
  );
  return data.map((t) => ({
    ...t,
    currentPeriodEnd: periodEndByTenant.get(t.id) ?? null,
  })) as TenantWithPlan[];
}

export default async function SubscriptionsPage() {
  const tenants = await getTenantsWithPlan();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            color: "var(--dash-text)",
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Suscripciones
        </h1>
        <p style={{ color: "var(--dash-muted)", fontSize: 14 }}>
          {tenants.length} restaurante{tenants.length !== 1 ? "s" : ""} —
          gestioná los planes desde acá
        </p>
      </div>

      <SubscriptionsTable tenants={tenants} />
    </div>
  );
}
