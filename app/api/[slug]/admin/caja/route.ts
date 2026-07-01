import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import type { Order } from "@/types/supabase";

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
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const [{ data: rawToday, error }, { data: rawYesterday }] = await Promise.all(
    [
      db
        .from("orders")
        .select("total, payment_method, delivery_type, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString()),
      db
        .from("orders")
        .select("total, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", todayStart.toISOString())
        .neq("status", "cancelled"),
    ],
  );

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  const all = (rawToday ?? []) as Pick<
    Order,
    "total" | "payment_method" | "delivery_type" | "status"
  >[];

  const active = all.filter((o) => o.status !== "cancelled");
  const cancelados = all.filter((o) => o.status === "cancelled").length;

  const total = active.reduce((s, o) => s + o.total, 0);
  const efectivo = active
    .filter((o) => o.payment_method === "cash")
    .reduce((s, o) => s + o.total, 0);
  const transferencia = total - efectivo;
  const delivery = active
    .filter(
      (o) => o.delivery_type === "delivery" || o.delivery_type === "domicilio",
    )
    .reduce((s, o) => s + o.total, 0);
  const retiro = total - delivery;

  const ayer = (rawYesterday ?? []) as Pick<Order, "total" | "status">[];
  const totalAyer = ayer.reduce((s, o) => s + o.total, 0);

  const fecha = todayStart.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return NextResponse.json({
    fecha,
    total,
    efectivo,
    transferencia,
    delivery,
    retiro,
    cantidad: active.length,
    cancelados,
    vs_ayer: { total: totalAyer, cantidad: ayer.length },
  });
}
