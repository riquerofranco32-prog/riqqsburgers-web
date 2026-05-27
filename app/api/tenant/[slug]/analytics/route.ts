import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import type { AnalyticsResponse, DailyRevenue } from "@/types/dashboard";
import type { Order, OrderItem } from "@/types/supabase";

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

function computeTopProducts(
  orders: Order[],
): { name: string; quantity: number }[] {
  const map: Record<string, { name: string; quantity: number }> = {};
  for (const order of orders) {
    for (const item of order.items as OrderItem[]) {
      if (!map[item.name]) map[item.name] = { name: item.name, quantity: 0 };
      map[item.name].quantity += item.quantity;
    }
  }
  return Object.values(map)
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
  const { data: rawOrders, error } = await db
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (rawOrders ?? []) as Order[];
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
  const topProducts = computeTopProducts(orders);
  const dailyRevenue = buildDailyRevenue(orders, days, now);

  const body: AnalyticsResponse = {
    revenue,
    orderCount,
    avgTicket,
    topProducts,
    dailyRevenue,
  };
  return NextResponse.json(body);
}
