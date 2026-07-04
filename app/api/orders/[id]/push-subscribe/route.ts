import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { subscription } = (await req.json()) as {
    subscription: PushSubscriptionJSON;
  };

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const db = createServerClient();

  const { data: order } = await db
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 },
    );
  }

  await db.from("order_push_subscriptions").upsert(
    {
      order_id: id,
      endpoint: subscription.endpoint,
      subscription,
    },
    { onConflict: "endpoint" },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint)
    return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });

  const db = createServerClient();
  await db.from("order_push_subscriptions").delete().eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
