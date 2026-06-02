import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/authz";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { status: string };

  if (!body.status) {
    return NextResponse.json({ error: "status requerido" }, { status: 400 });
  }

  if (!(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verificar que la orden pertenece a un tenant del que el usuario es admin
  const { data: order } = await supabase
    .from("orders")
    .select("tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", order.tenant_id)
    .maybeSingle();

  if (!membership || !["admin", "superadmin"].includes(membership.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: body.status as OrderStatus })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
