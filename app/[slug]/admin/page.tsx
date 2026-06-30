import { createServerClient } from "@/lib/supabase";
import { getTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Product, Order } from "@/types/supabase";
import AdminDashboard from "@/components/AdminDashboard";
import BackButton from "@/components/BackButton";

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
        style={{ background: "var(--bg, #0d0d0d)" }}
      >
        <div
          className="text-center"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p
            style={{
              color: "var(--text-primary, #fff)",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Restaurante &quot;{slug}&quot; no encontrado
          </p>
          <p
            style={{
              color: "var(--text-muted, rgba(255,255,255,0.5))",
              fontSize: 14,
            }}
          >
            Verificá que el slug existe en Supabase o en data/restaurants/{slug}
            .json
          </p>
          <a
            href="/admin"
            style={{ color: "var(--accent, #FF6B35)", fontSize: 14 }}
          >
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

  const [{ data: rawOrders }, { data: rawProducts }] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("tenant_id", tenant.id)
      .gte("created_at", eightDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    db
      .from("products")
      .select(
        "id, name, category_id, tenant_id, description, price, image_url, badge, available, sort_order, created_at",
      )
      .eq("tenant_id", tenant.id),
  ]);

  const orders = (rawOrders ?? []) as Order[];
  const products = (rawProducts ?? []) as Product[];
  const unavailableProducts = products.filter((p) => !p.available);

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
      />
    </>
  );
}
