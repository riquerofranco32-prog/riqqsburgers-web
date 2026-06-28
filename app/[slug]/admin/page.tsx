import { createServerClient } from "@/lib/supabase";
import { getTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Category, Product, Order, OrderItem } from "@/types/supabase";
import type { CategoryRevenue, TopProduct } from "@/types/dashboard";
import AdminDashboard from "@/components/AdminDashboard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel Admin" };

// ── Helpers ───────────────────────────────────────────────────────────────────
// NOTE: computeKPIs y computeSalesLast7Days se eliminaron — los KPIs de "hoy"
// ahora se calculan únicamente en AdminDashboard (client-side) para garantizar
// que el filtro de pedidos cancelados sea consistente entre SSR y hydration.

const CATEGORY_COLORS: Record<string, string> = {
  Burgers: "#facc15",
  Promos: "#fb923c",
  Bebidas: "#60a5fa",
  Otros: "#52525b",
};

function computeCategoryRevenue(
  orders: Order[],
  products: Product[],
  categories: Category[],
): CategoryRevenue[] {
  const catMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items as OrderItem[]) {
      const product = products.find((p) => p.id === item.product_id);
      const category = product
        ? categories.find((c) => c.id === product.category_id)
        : null;
      const name = category?.name ?? "Otros";
      catMap[name] = (catMap[name] ?? 0) + item.price * item.quantity;
    }
  }
  return Object.entries(catMap)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] ?? "#52525b",
    }))
    .sort((a, b) => b.value - a.value);
}

function computeTopProducts(
  orders: Order[],
  products: Product[],
  categories: Category[],
): TopProduct[] {
  const map: Record<
    string,
    {
      name: string;
      qty: number;
      revenue: number;
      productRef?: Product;
    }
  > = {};

  for (const order of orders) {
    for (const item of order.items as OrderItem[]) {
      if (!map[item.product_id]) {
        map[item.product_id] = {
          name: item.name,
          qty: 0,
          revenue: 0,
          productRef: products.find((p) => p.id === item.product_id),
        };
      }
      map[item.product_id].qty += item.quantity;
      map[item.product_id].revenue += item.price * item.quantity;
    }
  }

  return Object.entries(map)
    .map(([product_id, data]) => {
      const cat = data.productRef
        ? categories.find((c) => c.id === data.productRef!.category_id)
        : null;
      return {
        product_id,
        name: data.name,
        category_name: cat?.name ?? null,
        category_emoji: cat?.emoji ?? null,
        quantity: data.qty,
        revenue: data.revenue,
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

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

  // Date range: 8 days ago (today + yesterday + 7-day chart)
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  eightDaysAgo.setHours(0, 0, 0, 0);

  // Fetch all data in parallel
  const [
    { data: rawOrders },
    { data: rawProducts },
    { data: rawCategories },
    { count: unavailableCount },
  ] = await Promise.all([
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
    db
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("active", true),
    db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("available", false),
  ]);

  const orders = (rawOrders ?? []) as Order[];
  const products = (rawProducts ?? []) as Product[];
  const categories = (rawCategories ?? []) as Category[];

  // Compute category/product breakdowns server-side (used for week/month ranges in the dashboard).
  // KPIs de "hoy" se calculan en el cliente para consistencia con el filtro de cancelados.
  // TODO: unificar categoryData y topProducts también al cliente cuando analytics API los soporte.
  const categoryData = computeCategoryRevenue(orders, products, categories);
  const topProducts = computeTopProducts(orders, products, categories);
  const recentOrders = orders.slice(0, 10);
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
        categoryData={categoryData}
        recentOrders={recentOrders}
        allOrders={orders}
        topProducts={topProducts}
        unavailableProducts={unavailableProducts}
        products={products}
        categories={categories}
      />
    </>
  );
}
