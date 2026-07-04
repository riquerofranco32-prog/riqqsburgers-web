import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const VALID_ROLES = ["admin", "staff"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let tenantId: string;
  try {
    ({ tenantId } = await assertTenantAdmin(slug));
  } catch (e) {
    return e as NextResponse;
  }

  const db = createServerClient();
  const { data } = await db
    .from("tenant_users")
    .select("id, email, role")
    .eq("tenant_id", tenantId)
    .neq("role", "superadmin")
    .order("role", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let tenantId: string;
  try {
    ({ tenantId } = await assertTenantAdmin(slug));
  } catch (e) {
    return e as NextResponse;
  }

  const body = (await req.json()) as {
    email?: string;
    password?: string;
    role?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` },
      { status: 400 },
    );
  }

  const db = createServerClient();

  const { data: existing } = await db
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya hay un miembro con ese email en este equipo" },
      { status: 409 },
    );
  }

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id ?? null;

  if (createError) {
    // El email puede pertenecer a una cuenta ya creada (otro tenant, u otro
    // rol acá mismo si se había borrado la fila de tenant_users antes).
    const { data: byEmail } = await db.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    userId =
      byEmail?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (!userId) {
      return NextResponse.json(
        { error: `No se pudo crear el usuario: ${createError.message}` },
        { status: 400 },
      );
    }
  }

  const { data: member, error: membershipError } = await db
    .from("tenant_users")
    .insert({ user_id: userId, tenant_id: tenantId, role, email })
    .select("id, email, role")
    .single();

  if (membershipError) {
    return NextResponse.json(
      { error: `No se pudo asignar el acceso: ${membershipError.message}` },
      { status: 400 },
    );
  }

  return NextResponse.json(member, { status: 201 });
}
