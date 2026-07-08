import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import type { Order, OrderItem } from "@/types/supabase";

const ACCENT = "FFFF6B35";
const ACCENT_DARK = "FFE85A2A";
const HEADER_BG = "FF1F2937";
const HEADER_TEXT = "FFFFFFFF";
const ROW_ALT = "FFF7F7F8";
const GREEN = "FF22C55E";
const RED = "FFEF4444";
const AMBER = "FFD97706";
const MUTED = "FF6B7280";

const MONEY_FMT = '"$" #,##0';
const PCT_FMT = "0.0%";

const PAYMENT_LABEL: Record<string, string> = {
  mercadopago: "Mercado Pago",
  efectivo: "Efectivo",
  cash: "Efectivo",
  transfer: "Transferencia",
};

const DELIVERY_LABEL: Record<string, string> = {
  domicilio: "Delivery",
  retiro: "Retiro en local",
  pickup: "Retiro en local",
  delivery: "Delivery",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Completado",
  pending: "Pendiente",
  cancelled: "Cancelado",
  preparing: "Preparando",
  ready: "Listo",
};

function formatItems(items: OrderItem[]): string {
  return items
    .map((it) => {
      const extras = it.extras?.length
        ? ` (+${it.extras.map((e) => e.name).join(", ")})`
        : "";
      const removed = it.removed_ingredients?.length
        ? ` (sin ${it.removed_ingredients.join(", ")})`
        : "";
      return `${it.quantity}x ${it.name}${extras}${removed}`;
    })
    .join("; ");
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_BG },
    };
    cell.font = { color: { argb: HEADER_TEXT }, bold: true, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: ACCENT } } };
  });
  row.height = 22;
}

function zebraStripe(ws: ExcelJS.Worksheet, firstDataRow: number) {
  for (let r = firstDataRow; r <= ws.rowCount; r++) {
    if ((r - firstDataRow) % 2 === 1) {
      ws.getRow(r).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ROW_ALT },
        };
      });
    }
  }
}

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
  const prevStartDate = new Date(year, mon - 2, 1);
  const monthLabel = startDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

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

  const [{ data: rawOrders }, { data: rawPrevOrders }] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("tenant_id", tenant.id)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false }),
    db
      .from("orders")
      .select("id, total, status")
      .eq("tenant_id", tenant.id)
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", startDate.toISOString()),
  ]);

  const orders = (rawOrders ?? []) as Order[];
  const prevOrders = (rawPrevOrders ?? []) as Pick<
    Order,
    "id" | "total" | "status"
  >[];

  // ── Métricas base ──────────────────────────────────────────────────────────

  const total = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgTicket = total > 0 ? Math.round(revenue / total) : 0;
  const discountTotal = orders.reduce(
    (s, o) => s + (o.discount_amount ?? 0),
    0,
  );
  const withCoupon = orders.filter((o) => o.coupon_code).length;

  const prevRevenue = prevOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const prevTotal = prevOrders.length;
  const revenueDelta =
    prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null;
  const ordersDelta = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;

  const byDay: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const d = o.created_at.slice(0, 10);
    if (!byDay[d]) byDay[d] = { count: 0, revenue: 0 };
    byDay[d].count += 1;
    byDay[d].revenue += o.total ?? 0;
  }
  const busyDay = Object.entries(byDay).sort(
    (a, b) => b[1].count - a[1].count,
  )[0];

  const byHour: Record<number, number> = {};
  for (const o of orders) {
    const h = new Date(o.created_at).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  }
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  const productStats: Record<
    string,
    { name: string; qty: number; revenue: number }
  > = {};
  for (const o of orders) {
    for (const item of o.items as OrderItem[]) {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
      }
      productStats[item.product_id].qty += item.quantity;
      productStats[item.product_id].revenue += item.price * item.quantity;
    }
  }
  const productsSorted = Object.values(productStats).sort(
    (a, b) => b.revenue - a.revenue,
  );
  const totalUnits = productsSorted.reduce((s, p) => s + p.qty, 0);
  const topProduct = productsSorted[0];

  const byPayment: Record<string, { count: number; revenue: number }> = {};
  const byDelivery: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const pay = o.payment_method ?? "—";
    if (!byPayment[pay]) byPayment[pay] = { count: 0, revenue: 0 };
    byPayment[pay].count += 1;
    byPayment[pay].revenue += o.total ?? 0;

    const del = o.delivery_type ?? "—";
    if (!byDelivery[del]) byDelivery[del] = { count: 0, revenue: 0 };
    byDelivery[del].count += 1;
    byDelivery[del].revenue += o.total ?? 0;
  }

  // ── Workbook ────────────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  wb.creator = "Takefyy";
  wb.created = new Date();

  // ── Hoja 1: Dashboard ────────────────────────────────────────────────────────

  const wsDash = wb.addWorksheet("Dashboard", {
    views: [{ showGridLines: false }],
  });
  wsDash.columns = [{ width: 32 }, { width: 20 }, { width: 20 }, { width: 20 }];

  wsDash.mergeCells("A1:D1");
  const titleCell = wsDash.getCell("A1");
  titleCell.value = `${tenant.name} — Reporte de ${monthLabel}`;
  titleCell.font = { bold: true, size: 18, color: { argb: ACCENT_DARK } };
  wsDash.getRow(1).height = 32;

  wsDash.mergeCells("A2:D2");
  wsDash.getCell("A2").value = "Generado desde el panel de Takefyy";
  wsDash.getCell("A2").font = {
    italic: true,
    size: 10,
    color: { argb: MUTED },
  };

  const kpis: Array<{
    label: string;
    value: number | string;
    fmt?: string;
    delta?: number | null;
  }> = [
    {
      label: "Ingreso total",
      value: revenue,
      fmt: MONEY_FMT,
      delta: revenueDelta,
    },
    { label: "Pedidos totales", value: total, delta: ordersDelta },
    { label: "Ticket promedio", value: avgTicket, fmt: MONEY_FMT },
    { label: "Pedidos completados", value: completed },
    { label: "Pedidos pendientes", value: pending },
    { label: "Pedidos cancelados", value: cancelled },
    { label: "Descuentos aplicados", value: discountTotal, fmt: MONEY_FMT },
    { label: "Pedidos con cupón", value: withCoupon },
  ];

  let kpiRow = 4;
  wsDash.getCell(`A${kpiRow}`).value = "Métrica";
  wsDash.getCell(`B${kpiRow}`).value = "Valor";
  wsDash.getCell(`C${kpiRow}`).value = "vs. mes anterior";
  styleHeaderRow(wsDash.getRow(kpiRow));
  kpiRow++;

  const firstKpiDataRow = kpiRow;
  for (const k of kpis) {
    const row = wsDash.getRow(kpiRow);
    row.getCell(1).value = k.label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = k.value;
    if (k.fmt) row.getCell(2).numFmt = k.fmt;
    row.getCell(2).font = { size: 12 };
    if (k.delta !== undefined && k.delta !== null) {
      row.getCell(3).value = k.delta;
      row.getCell(3).numFmt = "+0.0%;-0.0%";
      row.getCell(3).font = {
        bold: true,
        color: { argb: k.delta >= 0 ? GREEN : RED },
      };
    } else if (k.delta === null) {
      row.getCell(3).value = "sin datos previos";
      row.getCell(3).font = { italic: true, size: 10, color: { argb: MUTED } };
    }
    kpiRow++;
  }
  zebraStripe(wsDash, firstKpiDataRow);
  wsDash.getRow(kpiRow).height = 8;
  kpiRow += 1;

  const highlights = [
    [
      "Día con más pedidos",
      busyDay
        ? `${new Date(busyDay[0]).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} — ${busyDay[1].count} pedidos`
        : "—",
    ],
    [
      "Horario pico",
      peakHour
        ? `${peakHour[0]}:00 - ${Number(peakHour[0]) + 1}:00hs (${peakHour[1]} pedidos)`
        : "—",
    ],
    [
      "Producto más vendido",
      topProduct ? `${topProduct.name} (${topProduct.qty} unidades)` : "—",
    ],
  ];
  wsDash.getCell(`A${kpiRow}`).value = "Destacados del mes";
  wsDash.getCell(`A${kpiRow}`).font = {
    bold: true,
    size: 13,
    color: { argb: ACCENT_DARK },
  };
  kpiRow++;
  for (const [label, value] of highlights) {
    wsDash.getCell(`A${kpiRow}`).value = label;
    wsDash.getCell(`A${kpiRow}`).font = { bold: true };
    wsDash.mergeCells(`B${kpiRow}:D${kpiRow}`);
    wsDash.getCell(`B${kpiRow}`).value = value;
    kpiRow++;
  }

  // ── Hoja 2: Pedidos ────────────────────────────────────────────────────────

  const wsOrders = wb.addWorksheet("Pedidos", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  wsOrders.columns = [
    { header: "Fecha", key: "date", width: 18 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Cliente", key: "customer", width: 20 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Entrega", key: "delivery", width: 14 },
    { header: "Pago", key: "payment", width: 16 },
    { header: "Subtotal", key: "subtotal", width: 12 },
    { header: "Envío", key: "deliveryCost", width: 10 },
    { header: "Descuento", key: "discount", width: 12 },
    { header: "Total", key: "total", width: 12 },
    { header: "Cupón", key: "coupon", width: 12 },
    { header: "Items", key: "items", width: 50 },
    { header: "Notas", key: "notes", width: 24 },
  ];
  styleHeaderRow(wsOrders.getRow(1));

  for (const o of orders) {
    wsOrders.addRow({
      date: new Date(o.created_at).toLocaleString("es-AR"),
      status: STATUS_LABEL[o.status] ?? o.status,
      customer: o.customer_name ?? "",
      phone: o.customer_phone ?? "",
      delivery: DELIVERY_LABEL[o.delivery_type ?? ""] ?? o.delivery_type,
      payment: PAYMENT_LABEL[o.payment_method] ?? o.payment_method,
      subtotal: o.subtotal,
      deliveryCost: o.delivery_cost,
      discount: o.discount_amount ?? 0,
      total: o.total,
      coupon: o.coupon_code ?? "",
      items: formatItems(o.items as OrderItem[]),
      notes: o.notes ?? "",
    });
  }
  ["subtotal", "deliveryCost", "discount", "total"].forEach((key) => {
    wsOrders.getColumn(key).numFmt = MONEY_FMT;
  });
  zebraStripe(wsOrders, 2);

  wsOrders.getColumn("status").eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = orders[rowNumber - 2]?.status;
    const color =
      raw === "completed" ? GREEN : raw === "cancelled" ? RED : AMBER;
    cell.font = { bold: true, color: { argb: color } };
  });

  wsOrders.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 13 },
  };

  // ── Hoja 3: Productos ──────────────────────────────────────────────────────

  const wsProducts = wb.addWorksheet("Productos", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  wsProducts.columns = [
    { header: "Producto", key: "name", width: 32 },
    { header: "Unidades vendidas", key: "qty", width: 18 },
    { header: "% de unidades", key: "pctUnits", width: 14 },
    { header: "Ingreso generado", key: "revenue", width: 18 },
    { header: "% de ingreso", key: "pctRevenue", width: 14 },
  ];
  styleHeaderRow(wsProducts.getRow(1));

  for (const p of productsSorted) {
    wsProducts.addRow({
      name: p.name,
      qty: p.qty,
      pctUnits: totalUnits > 0 ? p.qty / totalUnits : 0,
      revenue: p.revenue,
      pctRevenue: revenue > 0 ? p.revenue / revenue : 0,
    });
  }
  wsProducts.getColumn("pctUnits").numFmt = PCT_FMT;
  wsProducts.getColumn("pctRevenue").numFmt = PCT_FMT;
  wsProducts.getColumn("revenue").numFmt = MONEY_FMT;
  zebraStripe(wsProducts, 2);

  if (productsSorted.length > 0) {
    wsProducts.addConditionalFormatting({
      ref: `D2:D${productsSorted.length + 1}`,
      rules: [
        {
          type: "dataBar",
          priority: 1,
          gradient: true,
          border: false,
          color: { argb: ACCENT },
          minLength: 0,
          maxLength: 100,
          cfvo: [{ type: "min" }, { type: "max" }],
        } as unknown as ExcelJS.DataBarRuleType,
      ],
    });
  }

  // ── Hoja 4: Ventas por día ─────────────────────────────────────────────────

  const wsDaily = wb.addWorksheet("Ventas por día", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  wsDaily.columns = [
    { header: "Fecha", key: "date", width: 16 },
    { header: "Pedidos", key: "count", width: 12 },
    { header: "Ingreso", key: "revenue", width: 16 },
    { header: "Ticket promedio", key: "avg", width: 16 },
  ];
  styleHeaderRow(wsDaily.getRow(1));

  const daysSorted = Object.entries(byDay).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [date, d] of daysSorted) {
    wsDaily.addRow({
      date: new Date(date).toLocaleDateString("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      count: d.count,
      revenue: d.revenue,
      avg: d.count > 0 ? Math.round(d.revenue / d.count) : 0,
    });
  }
  wsDaily.getColumn("revenue").numFmt = MONEY_FMT;
  wsDaily.getColumn("avg").numFmt = MONEY_FMT;
  zebraStripe(wsDaily, 2);

  if (daysSorted.length > 0) {
    wsDaily.addConditionalFormatting({
      ref: `C2:C${daysSorted.length + 1}`,
      rules: [
        {
          type: "colorScale",
          priority: 1,
          cfvo: [{ type: "min" }, { type: "max" }],
          color: [{ argb: "FFFFF3E0" }, { argb: ACCENT }],
        } as ExcelJS.ColorScaleRuleType,
      ],
    });
  }

  // ── Hoja 5: Pagos y entrega ────────────────────────────────────────────────

  const wsBreakdown = wb.addWorksheet("Pagos y entrega", {
    views: [{ showGridLines: false }],
  });
  wsBreakdown.columns = [
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
  ];

  wsBreakdown.getCell("A1").value = "Método de pago";
  wsBreakdown.getCell("B1").value = "Pedidos";
  wsBreakdown.getCell("C1").value = "Ingreso";
  wsBreakdown.getCell("D1").value = "% del total";
  styleHeaderRow(wsBreakdown.getRow(1));

  let r = 2;
  for (const [key, d] of Object.entries(byPayment).sort(
    (a, b) => b[1].revenue - a[1].revenue,
  )) {
    wsBreakdown.getCell(`A${r}`).value = PAYMENT_LABEL[key] ?? key;
    wsBreakdown.getCell(`B${r}`).value = d.count;
    wsBreakdown.getCell(`C${r}`).value = d.revenue;
    wsBreakdown.getCell(`C${r}`).numFmt = MONEY_FMT;
    wsBreakdown.getCell(`D${r}`).value = revenue > 0 ? d.revenue / revenue : 0;
    wsBreakdown.getCell(`D${r}`).numFmt = PCT_FMT;
    r++;
  }
  zebraStripe(wsBreakdown, 2);

  r += 2;
  wsBreakdown.getCell(`A${r}`).value = "Tipo de entrega";
  wsBreakdown.getCell(`B${r}`).value = "Pedidos";
  wsBreakdown.getCell(`C${r}`).value = "Ingreso";
  wsBreakdown.getCell(`D${r}`).value = "% del total";
  styleHeaderRow(wsBreakdown.getRow(r));
  r++;
  const firstDeliveryRow = r;
  for (const [key, d] of Object.entries(byDelivery).sort(
    (a, b) => b[1].revenue - a[1].revenue,
  )) {
    wsBreakdown.getCell(`A${r}`).value = DELIVERY_LABEL[key] ?? key;
    wsBreakdown.getCell(`B${r}`).value = d.count;
    wsBreakdown.getCell(`C${r}`).value = d.revenue;
    wsBreakdown.getCell(`C${r}`).numFmt = MONEY_FMT;
    wsBreakdown.getCell(`D${r}`).value = revenue > 0 ? d.revenue / revenue : 0;
    wsBreakdown.getCell(`D${r}`).numFmt = PCT_FMT;
    r++;
  }
  for (let rr = firstDeliveryRow; rr < r; rr++) {
    if ((rr - firstDeliveryRow) % 2 === 1) {
      wsBreakdown.getRow(rr).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ROW_ALT },
        };
      });
    }
  }

  // ── Salida ─────────────────────────────────────────────────────────────────

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `reporte-${slug}-${month}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
