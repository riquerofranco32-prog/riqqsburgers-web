import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { subscription, tenant_id } = (await req.json()) as {
    subscription: PushSubscriptionJSON;
    tenant_id: string;
  };

  if (!subscription?.endpoint || !tenant_id) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const db = createServerClient();

  // Verify user has access to this tenant
  const { data: access } = await db
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  const { data: superAdmin } = await db
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "superadmin")
    .limit(1)
    .maybeSingle();

  if (!access && !superAdmin) {
    return NextResponse.json(
      { error: "Sin acceso a este tenant" },
      { status: 403 },
    );
  }

  await db.from("push_subscriptions").upsert(
    {
      tenant_id,
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
    },
    { onConflict: "user_id,endpoint" },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint)
    return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });

  const db = createServerClient();
  await db
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
