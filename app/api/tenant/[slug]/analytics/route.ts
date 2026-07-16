import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { startOfDayInBuenosAires } from "@/lib/businessHours";
import { getEffectiveSubscription } from "@/lib/subscriptions";
import { getPlanLimits, type PlanId } from "@/lib/plans";
import type {
  AnalyticsResponse,
  DailyRevenue,
  CategoryRevenue,
  TopProduct,
} from "@/types/dashboard";
import type { Order, OrderItem, Product, Category } from "@/types/supabase";

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

function buildDailyRevenue(
  orders: Order[],
  days: number,
  from: Date,
): DailyRevenue[] {
  const result: DailyRevenue[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDayInBuenosAires(from);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day.getTime() + 86_400_000);

    const dayTotal = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= day && d < nextDay;
      })
      .reduce((s, o) => s + o.total, 0);

    const isToday = i === 0;
    const raw = day.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
    const label = isToday ? "Hoy" : raw;
    // `day` es medianoche ART representada como instante UTC (3hs), así que
    // sus componentes UTC son directamente el día calendario en Argentina.
    const isoDate = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
    result.push({ date: label, total: dayTotal, isoDate });
  }
  return result;
}

function buildCategoryRevenue(
  orders: Order[],
  products: Product[],
  categories: Category[],
): CategoryRevenue[] {
  const catMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of (order.items ?? []) as OrderItem[]) {
      const product = products.find((p) => p.id === item.product_id);
      const category = product
        ? categories.find((c) => c.id === product.category_id)
        : null;
      const name = category?.name ?? "Otros";
      catMap[name] = (catMap[name] ?? 0) + item.price * item.quantity;
    }
  }
  return Object.entries(catMap)
    .map(([name, value]) => ({ name, value, color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value);
}

function buildTopProducts(
  orders: Order[],
  products: Product[],
  categories: Category[],
): TopProduct[] {
  const map: Record<
    string,
    { name: string; qty: number; revenue: number; productRef?: Product }
  > = {};
  for (const order of orders) {
    for (const item of (order.items ?? []) as OrderItem[]) {
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

function buildPeakHour(
  orders: Order[],
): { hour: number; count: number } | null {
  const byHour: Record<number, number> = {};
  for (const o of orders) {
    const h = new Date(o.created_at).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  }
  const top = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  return top ? { hour: Number(top[0]), count: top[1] } : null;
}

export async function GET(
  req: NextRequest,
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

  const range = req.nextUrl.searchParams.get("range");
  if (
    range !== "today" &&
    range !== "week" &&
    range !== "twoWeeks" &&
    range !== "month"
  ) {
    return NextResponse.json(
      { error: 'range debe ser "today", "week", "twoWeeks" o "month"' },
      { status: 400 },
    );
  }

  if (range !== "today") {
    const subscription = await getEffectiveSubscription(tenantId);
    const limits = getPlanLimits(subscription.plan as PlanId);
    if (!limits.analyticsEnabled) {
      return NextResponse.json(
        {
          error:
            "Las estadísticas históricas son parte del plan Pro. Actualizá tu plan para verlas.",
          code: "PLAN_LIMIT_REACHED",
        },
        { status: 403 },
      );
    }
  }

  const days =
    range === "today"
      ? 1
      : range === "week"
        ? 7
        : range === "twoWeeks"
          ? 14
          : 30;
  const now = new Date();
  const from = startOfDayInBuenosAires(now);
  from.setDate(from.getDate() - (days - 1));
  // Período anterior de igual longitud, para comparar (semana vs. semana
  // anterior / mes vs. mes anterior) — una sola query cubre ambos rangos.
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - days);

  const db = createServerClient();
  const [
    { data: rawOrders, error },
    { data: rawProducts },
    { data: rawCategories },
  ] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("created_at", prevFrom.toISOString())
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

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  const rawOrdersAll = (rawOrders ?? []) as Order[];
  const allOrders = rawOrdersAll.filter((o) => o.status !== "cancelled");
  const orders = allOrders.filter((o) => new Date(o.created_at) >= from);
  const prevOrders = allOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= prevFrom && d < from;
  });
  const products = (rawProducts ?? []) as Product[];
  const categories = (rawCategories ?? []) as Category[];

  // Incluye cancelados (a diferencia de `orders` arriba) para medir qué % del
  // total de pedidos del período se cancelaron.
  const allOrdersInPeriodIncludingCancelled = rawOrdersAll.filter(
    (o) => new Date(o.created_at) >= from,
  );
  const cancelledCount =
    allOrdersInPeriodIncludingCancelled.length - orders.length;
  const cancelledRate =
    allOrdersInPeriodIncludingCancelled.length > 0
      ? (cancelledCount / allOrdersInPeriodIncludingCancelled.length) * 100
      : 0;

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const prevOrderCount = prevOrders.length;
  const prevAvgTicket =
    prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

  function pctChange(current: number, previous: number): number | null {
    return previous > 0 ? ((current - previous) / previous) * 100 : null;
  }

  const topProducts = buildTopProducts(orders, products, categories);
  const dailyRevenue = buildDailyRevenue(orders, days, now);
  const categoryRevenue = buildCategoryRevenue(orders, products, categories);
  const peakHour = buildPeakHour(orders);

  const body: AnalyticsResponse = {
    revenue,
    orderCount,
    avgTicket,
    revenueChange: pctChange(revenue, prevRevenue),
    orderCountChange: pctChange(orderCount, prevOrderCount),
    avgTicketChange: pctChange(avgTicket, prevAvgTicket),
    topProducts,
    dailyRevenue,
    categoryRevenue,
    peakHour,
    cancelledCount,
    cancelledRate,
  };
  return NextResponse.json(body);
}
