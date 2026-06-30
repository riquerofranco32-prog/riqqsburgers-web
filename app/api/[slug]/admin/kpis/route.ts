import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import type { Order, OrderItem, Product, Category } from "@/types/supabase";
import type {
  TodayKPIsResponse,
  DailyRevenue,
  CategoryRevenue,
  TopProduct,
} from "@/types/dashboard";

const CATEGORY_PALETTE = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
] as const;

function categoryColor(name: string): string {
  if (!name) return "#71717a";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const db = createServerClient();
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  eightDaysAgo.setHours(0, 0, 0, 0);

  const [
    { data: rawOrders, error: ordersError },
    { data: rawProducts, error: productsError },
    { data: rawCategories, error: categoriesError },
  ] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("created_at", eightDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    db
      .from("products")
      .select("id, name, category_id, available")
      .eq("tenant_id", tenantId),
    db
      .from("categories")
      .select("id, name, emoji")
      .eq("tenant_id", tenantId)
      .eq("active", true),
  ]);

  if (ordersError)
    return NextResponse.json(
      { error: safeDbError(ordersError) },
      { status: 500 },
    );
  if (productsError)
    return NextResponse.json(
      { error: safeDbError(productsError) },
      { status: 500 },
    );
  if (categoriesError)
    return NextResponse.json(
      { error: safeDbError(categoriesError) },
      { status: 500 },
    );

  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - 86_400_000);

  const allOrders = (rawOrders ?? []) as Order[];
  const products = (rawProducts ?? []) as Product[];
  const categories = (rawCategories ?? []) as Category[];

  const activeOrders = allOrders.filter((o) => o.status !== "cancelled");
  const todayOrders = activeOrders.filter(
    (o) => new Date(o.created_at) >= today,
  );
  const yesterdayOrders = activeOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= yesterday && d < today;
  });

  // ── Today KPIs ────────────────────────────────────────────────────────────

  const ordersToday = todayOrders.length;
  const ordersYesterday = yesterdayOrders.length;
  const ordersTodayChange =
    ordersYesterday > 0
      ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100
      : null;

  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const revenueYesterday = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueTodayChange =
    revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : null;

  const avgTicketToday =
    ordersToday > 0 ? Math.round(revenueToday / ordersToday) : 0;
  const avgTicketYesterday =
    ordersYesterday > 0 ? Math.round(revenueYesterday / ordersYesterday) : 0;
  const avgTicketChange =
    avgTicketYesterday > 0
      ? ((avgTicketToday - avgTicketYesterday) / avgTicketYesterday) * 100
      : null;

  const itemMap: Record<string, { name: string; qty: number }> = {};
  for (const order of todayOrders) {
    for (const item of (order.items ?? []) as OrderItem[]) {
      if (!itemMap[item.product_id])
        itemMap[item.product_id] = { name: item.name, qty: 0 };
      itemMap[item.product_id].qty += item.quantity;
    }
  }
  const topProductToday =
    Object.values(itemMap).sort((a, b) => b.qty - a.qty)[0] ?? null;

  const activeProducts = products.filter((p) => p.available).length;

  // ── Sales last 7 days ─────────────────────────────────────────────────────

  const salesLast7Days: DailyRevenue[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day.getTime() + 86_400_000);
    const dayTotal = activeOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= day && d < nextDay;
      })
      .reduce((s, o) => s + o.total, 0);
    const isToday = i === 0;
    const raw = day.toLocaleDateString("es-AR", { weekday: "short" });
    const label = isToday
      ? "Hoy"
      : raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
    salesLast7Days.push({ date: label, total: dayTotal });
  }

  // ── Category revenue (last 8 days) ────────────────────────────────────────

  const catMap: Record<string, number> = {};
  for (const order of activeOrders) {
    for (const item of (order.items ?? []) as OrderItem[]) {
      const product = products.find((p) => p.id === item.product_id);
      const category = product
        ? categories.find((c) => c.id === product.category_id)
        : null;
      const name = category?.name ?? "Otros";
      catMap[name] = (catMap[name] ?? 0) + item.price * item.quantity;
    }
  }
  const categoryRevenue: CategoryRevenue[] = Object.entries(catMap)
    .map(([name, value]) => ({ name, value, color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value);

  // ── Top products (last 8 days) ────────────────────────────────────────────

  const prodMap: Record<
    string,
    { name: string; qty: number; revenue: number; productRef?: Product }
  > = {};
  for (const order of activeOrders) {
    for (const item of (order.items ?? []) as OrderItem[]) {
      if (!prodMap[item.product_id]) {
        prodMap[item.product_id] = {
          name: item.name,
          qty: 0,
          revenue: 0,
          productRef: products.find((p) => p.id === item.product_id),
        };
      }
      prodMap[item.product_id].qty += item.quantity;
      prodMap[item.product_id].revenue += item.price * item.quantity;
    }
  }
  const topProducts: TopProduct[] = Object.entries(prodMap)
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

  const body: TodayKPIsResponse = {
    ordersToday,
    ordersTodayChange,
    revenueToday,
    revenueTodayChange,
    avgTicketToday,
    avgTicketChange,
    topProductToday,
    activeProducts,
    salesLast7Days,
    categoryRevenue,
    topProducts,
  };

  return NextResponse.json(body);
}
