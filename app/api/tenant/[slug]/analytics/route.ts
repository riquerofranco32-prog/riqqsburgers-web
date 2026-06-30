import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
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

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function buildDailyRevenue(
  orders: Order[],
  days: number,
  from: Date,
): DailyRevenue[] {
  const result: DailyRevenue[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(new Date(from));
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
    result.push({ date: label, total: dayTotal });
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
  if (range !== "week" && range !== "month") {
    return NextResponse.json(
      { error: 'range debe ser "week" o "month"' },
      { status: 400 },
    );
  }

  const days = range === "week" ? 7 : 30;
  const now = new Date();
  const from = startOfDay(new Date(now));
  from.setDate(from.getDate() - (days - 1));

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
      .gte("created_at", from.toISOString())
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

  const orders = (rawOrders ?? []).filter(
    (o) => o.status !== "cancelled",
  ) as Order[];
  const products = (rawProducts ?? []) as Product[];
  const categories = (rawCategories ?? []) as Category[];

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
  const topProducts = buildTopProducts(orders, products, categories);
  const dailyRevenue = buildDailyRevenue(orders, days, now);
  const categoryRevenue = buildCategoryRevenue(orders, products, categories);

  const body: AnalyticsResponse = {
    revenue,
    orderCount,
    avgTicket,
    topProducts,
    dailyRevenue,
    categoryRevenue,
  };
  return NextResponse.json(body);
}
