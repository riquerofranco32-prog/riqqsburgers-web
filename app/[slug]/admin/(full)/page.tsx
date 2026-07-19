import { createServerClient } from "@/lib/supabase";
import { getTenant } from "@/lib/tenants";
import { getEffectiveSubscription, trialDaysLeft } from "@/lib/subscriptions";
import { getPlanLimits, type PlanId } from "@/lib/plans";
import type { Metadata } from "next";
import type { Product, Order } from "@/types/supabase";
import AdminDashboard from "@/components/AdminDashboard";
import BackButton from "@/components/BackButton";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel Admin" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await getTenant(slug);
  if (!tenant) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--dash-bg)" }}
      >
        <div
          className="text-center"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p
            style={{
              color: "var(--dash-text)",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Restaurante &quot;{slug}&quot; no encontrado
          </p>
          <p style={{ color: "var(--dash-muted)", fontSize: 14 }}>
            Verificá que el slug existe en Supabase o en data/restaurants/{slug}
            .json
          </p>
          <a href="/admin" style={{ color: "var(--accent)", fontSize: 14 }}>
            → Ir al panel Takefyy
          </a>
        </div>
      </div>
    );
  }

  const db = createServerClient();

  // Date range: 8 days ago — for RecentOrdersTable + PeakHoursWidget initial data.
  // KPI computation (today/week/month) is handled server-side by /api/[slug]/admin/kpis
  // and /api/tenant/[slug]/analytics respectively.
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  eightDaysAgo.setHours(0, 0, 0, 0);

  const [{ data: rawOrders }, { data: rawProducts }, subscription] =
    await Promise.all([
      db
        .from("orders")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("created_at", eightDaysAgo.toISOString())
        .order("created_at", { ascending: false }),
      db
        .from("products")
        .select(
          "id, name, category_id, tenant_id, description, price, image_url, badge, available, sort_order, created_at, stock_quantity",
        )
        .eq("tenant_id", tenant.id),
      getEffectiveSubscription(tenant.id),
    ]);

  const orders = (rawOrders ?? []) as Order[];
  const products = (rawProducts ?? []) as Product[];
  const unavailableProducts = products.filter((p) => !p.available);
  // ponytail: umbral fijo, no hace falta que sea configurable por tenant todavía
  const lowStockProducts = products
    .filter(
      (p) =>
        p.available &&
        p.stock_quantity !== null &&
        p.stock_quantity > 0 &&
        p.stock_quantity <= LOW_STOCK_THRESHOLD,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stock_quantity as number,
    }));
  const trialDays = trialDaysLeft(subscription);
  const planExpired = subscription.status === "expired";
  const analyticsEnabled = getPlanLimits(
    subscription.plan as PlanId,
  ).analyticsEnabled;

  const onboarding = {
    hasLogo: Boolean(tenant.logo_url),
    productCount: products.length,
    hasPhotos: products.some((p) => Boolean(p.image_url)),
    hasHours:
      tenant.business_hours !== null && tenant.business_hours !== undefined,
  };

  return (
    <>
      <div className="px-4 pt-4 md:px-6">
        <BackButton href={`/${slug}`} label="Ver menú público" />
      </div>
      <AdminDashboard
        tenantName={tenant.name}
        slug={slug}
        tenantId={tenant.id}
        isOpen={tenant.is_open}
        allOrders={orders}
        unavailableProducts={unavailableProducts}
        lowStockProducts={lowStockProducts}
        trialDaysLeft={trialDays}
        planExpired={planExpired}
        analyticsEnabled={analyticsEnabled}
        onboarding={onboarding}
      />
    </>
  );
}
