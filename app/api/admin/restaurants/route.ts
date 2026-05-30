import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getAllTenants } from "@/lib/tenants";
import { assertSuperAdmin } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }
  const tenants = await getAllTenants();
  return NextResponse.json(tenants);
}

const VALID_PLANS = ["free", "pro", "premium"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type AdminClient = ReturnType<typeof createServerClient>;

// Busca un usuario de Auth existente por email.
// Supabase admin API no expone getUserByEmail, pero el caso de "email ya
// existe" ocurre solo al intentar createUser — en ese escenario el usuario
// recién creado está en la primera página (orden descendente por created_at).
// Si no está ahí, hacemos una segunda pasada completa como fallback.
async function findUserByEmail(
  db: AdminClient,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();

  const checkPage = async (page: number): Promise<string | null> => {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users.length) return null;
    return (
      data.users.find((u) => u.email?.toLowerCase() === target)?.id ?? null
    );
  };

  // Fast path: check page 1 first (most recently created users)
  const fast = await checkPage(1);
  if (fast) return fast;

  // Full scan fallback (capped at 50 pages = 10k users)
  for (let page = 2; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users.length) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }

  const body = (await req.json()) as {
    slug: string;
    name: string;
    tagline?: string;
    whatsapp_number: string;
    instagram?: string;
    logo_url?: string;
    accent_color?: string;
    address?: string;
    schedule?: string;
    is_open?: boolean;
    plan?: string;
    owner_email?: string;
    owner_password?: string;
  };

  if (!body.slug || !body.name || !body.whatsapp_number) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json(
      { error: "Slug inválido (solo letras minúsculas, números y guiones)" },
      { status: 400 },
    );
  }

  const ownerEmail = body.owner_email?.trim().toLowerCase() ?? "";
  const ownerPassword = body.owner_password ?? "";

  if (!EMAIL_RE.test(ownerEmail)) {
    return NextResponse.json(
      { error: "Email del dueño inválido" },
      { status: 400 },
    );
  }
  if (ownerPassword.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` },
      { status: 400 },
    );
  }

  const plan = (VALID_PLANS as readonly string[]).includes(body.plan ?? "")
    ? (body.plan as string)
    : "free";

  const supabase = createServerClient();

  // 1. Crear el tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline || null,
      whatsapp_number: body.whatsapp_number,
      instagram_handle: body.instagram || null,
      logo_url: body.logo_url || null,
      primary_color: body.accent_color || "#FF6B35",
      secondary_color: "#FFB347",
      background_color: "#FFFAF7",
      delivery_cost: 0,
      address: body.address || null,
      schedule: body.schedule || null,
      is_open: body.is_open ?? true,
      active: true,
      plan,
    })
    .select("id, slug, name")
    .single();

  if (tenantError) {
    const msg =
      tenantError.code === "23505"
        ? "Ya existe un restaurante con ese slug"
        : tenantError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 2. Crear (o reutilizar) el usuario dueño en Supabase Auth
  let ownerUserId: string | null = null;
  let createdNewUser = false;

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    });

  if (createError) {
    // El email puede ya existir (dueño de varios locales): lo enlazamos.
    ownerUserId = await findUserByEmail(supabase, ownerEmail);
    if (!ownerUserId) {
      await supabase.from("tenants").delete().eq("id", tenant.id);
      return NextResponse.json(
        { error: `No se pudo crear el usuario dueño: ${createError.message}` },
        { status: 400 },
      );
    }
  } else {
    ownerUserId = created.user.id;
    createdNewUser = true;
  }

  // 3. Vincular el usuario al tenant como admin
  const { error: membershipError } = await supabase
    .from("tenant_users")
    .insert({
      user_id: ownerUserId,
      tenant_id: tenant.id,
      role: "admin",
    });

  if (membershipError) {
    // Rollback: borrar el tenant y, si lo creamos recién, el usuario.
    await supabase.from("tenants").delete().eq("id", tenant.id);
    if (createdNewUser && ownerUserId) {
      await supabase.auth.admin.deleteUser(ownerUserId);
    }
    return NextResponse.json(
      {
        error: `No se pudo asignar el acceso del dueño: ${membershipError.message}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { ...tenant, owner_email: ownerEmail, owner_created: createdNewUser },
    { status: 201 },
  );
}
