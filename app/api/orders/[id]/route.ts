import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, getTenantRole } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { sendPushToOrder } from "@/lib/push";
import { logActivity } from "@/lib/activityLog";

const STATUS_PUSH_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "Pedido confirmado ✅",
    body: "Ya lo estamos preparando.",
  },
  preparing: {
    title: "En preparación 👨‍🍳",
    body: "Tu pedido se está cocinando.",
  },
  ready: { title: "¡Tu pedido está listo! 🎉", body: "Ya podés retirarlo." },
  delivered: { title: "Pedido entregado 📦", body: "¡Que lo disfrutes!" },
};

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
  const body = (await req.json()) as {
    status?: string;
    kitchen_notes?: string | null;
  };

  const hasStatus = "status" in body;
  const hasKitchenNotes = "kitchen_notes" in body;

  if (!hasStatus && !hasKitchenNotes) {
    return NextResponse.json(
      { error: "Se requiere status o kitchen_notes" },
      { status: 400 },
    );
  }

  if (
    hasStatus &&
    !(ALLOWED_STATUSES as readonly string[]).includes(body.status!)
  ) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  if (
    hasKitchenNotes &&
    body.kitchen_notes !== null &&
    typeof body.kitchen_notes !== "string"
  ) {
    return NextResponse.json(
      { error: "kitchen_notes inválido" },
      { status: 400 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verificar que la orden pertenece a un tenant del que el usuario es admin
  const { data: order } = await supabase
    .from("orders")
    .select("tenant_id, order_ref, status")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { direct, superadmin } = await getTenantRole(user.id, order.tenant_id);
  const isAuthorized =
    (direct && ["admin", "staff", "superadmin"].includes(direct)) || superadmin;

  if (!isAuthorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (hasStatus) patch.status = body.status as OrderStatus;
  if (hasKitchenNotes) patch.kitchen_notes = body.kitchen_notes ?? null;

  const { error } = await supabase.from("orders").update(patch).eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  if (hasStatus) {
    const msg = STATUS_PUSH_MESSAGES[body.status!];
    if (msg) {
      void sendPushToOrder(id, {
        title: msg.title,
        body: msg.body,
        url: `/pedido/${order.order_ref}`,
      });
    }
    void logActivity({
      tenantId: order.tenant_id,
      actorEmail: user.email ?? "desconocido",
      action:
        body.status === "confirmed"
          ? "order.confirmed"
          : body.status === "cancelled"
            ? "order.cancelled"
            : "order.status_changed",
      entityType: "order",
      entityId: order.order_ref,
      metadata: { from: order.status, to: body.status },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Verificar que la orden pertenece a un tenant del que el usuario es admin
  const { data: order } = await supabase
    .from("orders")
    .select("tenant_id, order_ref")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { direct, superadmin } = await getTenantRole(user.id, order.tenant_id);
  const isAuthorized =
    (direct && ["admin", "superadmin"].includes(direct)) || superadmin;

  if (!isAuthorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  void logActivity({
    tenantId: order.tenant_id,
    actorEmail: user.email ?? "desconocido",
    action: "order.deleted",
    entityType: "order",
    entityId: order.order_ref,
  });
  return NextResponse.json({ ok: true });
}
