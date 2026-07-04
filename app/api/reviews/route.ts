import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { safeDbError } from "@/lib/db-error";

const DELIVERED_STATUSES = ["delivered", "entregado"];
const MAX_COMMENT = 500;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    order_ref?: string;
    rating?: number;
    comment?: string | null;
  };

  if (
    !body.order_ref ||
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (body.comment && body.comment.length > MAX_COMMENT) {
    return NextResponse.json(
      { error: `Comentario demasiado largo (máx. ${MAX_COMMENT} caracteres)` },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, tenant_id, status, customer_name")
    .eq("order_ref", body.order_ref.toUpperCase())
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 },
    );
  }

  if (!DELIVERED_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: "Todavía no se puede calificar este pedido" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      tenant_id: order.tenant_id,
      order_id: order.id,
      rating: body.rating,
      comment: body.comment?.trim() || null,
      customer_name: order.customer_name,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este pedido ya fue calificado" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
