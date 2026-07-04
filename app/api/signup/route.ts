import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { EMAIL_RE, MIN_PASSWORD, SLUG_RE } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name?: string;
    slug?: string;
    whatsapp_number?: string;
    email?: string;
    password?: string;
  };

  const name = body.name?.trim() ?? "";
  const slug = body.slug?.trim().toLowerCase() ?? "";
  const whatsappNumber = body.whatsapp_number?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!name || !whatsappNumber) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido (solo letras minúsculas, números y guiones)" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` },
      { status: 400 },
    );
  }

  const db = createServerClient();

  // Trial de Pro por 14 días — mismo default que el alta manual del superadmin.
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .insert({
      slug,
      name,
      whatsapp_number: whatsappNumber,
      primary_color: "#FF6B35",
      secondary_color: "#FFB347",
      background_color: "#FFFAF7",
      delivery_cost: 0,
      is_open: true,
      active: true,
      plan: "pro",
    })
    .select("id, slug, name")
    .single();

  if (tenantError) {
    const msg =
      tenantError.code === "23505"
        ? "Ese nombre de local ya está en uso, probá con otro"
        : tenantError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: subError } = await db.from("subscriptions").insert({
    tenant_id: tenant.id,
    plan: "pro",
    status: "trialing",
    current_period_end: trialEnd.toISOString(),
  });

  if (subError) {
    await db.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: `No se pudo crear la suscripción: ${subError.message}` },
      { status: 400 },
    );
  }

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    await db.from("tenants").delete().eq("id", tenant.id);
    const msg = createError.message.toLowerCase().includes("already")
      ? "Ese email ya tiene una cuenta. Iniciá sesión en vez de crear una nueva."
      : createError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: membershipError } = await db.from("tenant_users").insert({
    user_id: created.user.id,
    tenant_id: tenant.id,
    role: "admin",
    email,
  });

  if (membershipError) {
    await db.from("tenants").delete().eq("id", tenant.id);
    await db.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      {
        error: `No se pudo asignar el acceso: ${membershipError.message}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ slug: tenant.slug }, { status: 201 });
}
