import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import type { Order, OrderItem } from "@/types/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2025-06"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Parámetro 'month' requerido en formato YYYY-MM" },
      { status: 400 },
    );
  }

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 1);

  const db = createServerClient();

  const { data: tenant } = await db
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant no encontrado" },
      { status: 404 },
    );
  }

  const { data: rawOrders } = await db
    .from("orders")
    .select("*")
    .eq("tenant_id", tenant.id)
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString())
    .order("created_at", { ascending: false });

  const orders = (rawOrders ?? []) as Order[];

  // ── Hoja 1: Resumen ────────────────────────────────────────────────────────

  const total = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgTicket = total > 0 ? Math.round(revenue / total) : 0;

  // Día con más pedidos
  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const d = o.created_at.slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  }
  const busyDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  // Producto más pedido
  const productCount: Record<string, { name: string; qty: number }> = {};
  for (const o of orders) {
    for (const item of o.items as OrderItem[]) {
      if (!productCount[item.product_id]) {
        productCount[item.product_id] = { name: item.name, qty: 0 };
      }
      productCount[item.product_id].qty += item.quantity;
    }
  }
  const topProduct = Object.values(productCount).sort(
    (a, b) => b.qty - a.qty,
  )[0];

  const summaryData = [
    ["Reporte mensual", `${tenant.name} — ${month}`],
    [],
    ["Métrica", "Valor"],
    ["Total de pedidos", total],
    ["Pedidos completados", completed],
    ["Pedidos pendientes", pending],
    ["Pedidos cancelados", cancelled],
    ["Ingreso total estimado (ARS)", revenue],
    ["Ticket promedio (ARS)", avgTicket],
    [
      "Día con más pedidos",
      busyDay ? `${busyDay[0]} (${busyDay[1]} pedidos)` : "—",
    ],
    [
      "Producto más pedido",
      topProduct ? `${topProduct.name} (${topProduct.qty} unidades)` : "—",
    ],
  ];

  // ── Hoja 2: Pedidos ────────────────────────────────────────────────────────

  const ordersHeader = [
    "ID",
    "Fecha",
    "Estado",
    "Cliente",
    "Teléfono",
    "Tipo entrega",
    "Pago",
    "Subtotal",
    "Costo envío",
    "Total",
    "Items",
    "Notas",
  ];

  const ordersRows = orders.map((o) => [
    o.id,
    new Date(o.created_at).toLocaleString("es-AR"),
    o.status,
    o.customer_name ?? "",
    o.customer_phone ?? "",
    o.delivery_type,
    o.payment_method,
    o.subtotal,
    o.delivery_cost,
    o.total,
    JSON.stringify(o.items),
    o.notes ?? "",
  ]);

  // ── Hoja 3: Productos ──────────────────────────────────────────────────────

  const totalUnits = Object.values(productCount).reduce((s, p) => s + p.qty, 0);
  const productsRows = Object.values(productCount)
    .sort((a, b) => b.qty - a.qty)
    .map((p) => [
      p.name,
      p.qty,
      totalUnits > 0 ? `${((p.qty / totalUnits) * 100).toFixed(1)}%` : "0%",
    ]);

  // ── Construir workbook ─────────────────────────────────────────────────────

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  const wsOrders = XLSX.utils.aoa_to_sheet([ordersHeader, ...ordersRows]);
  XLSX.utils.book_append_sheet(wb, wsOrders, "Pedidos");

  const wsProducts = XLSX.utils.aoa_to_sheet([
    ["Producto", "Unidades vendidas", "% del total"],
    ...productsRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsProducts, "Productos");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `reporte-${slug}-${month}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
