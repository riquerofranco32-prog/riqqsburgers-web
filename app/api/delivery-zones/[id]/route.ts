import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const ALLOWED_FIELDS = ["name", "price", "active", "sort_order"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

const NAME_MAX = 60;
const MAX_PRICE = 1_000_000;

async function resolveTenantSlug(id: string) {
  const supabase = createServerClient();
  const { data: zone } = await supabase
    .from("delivery_zones")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!zone) return null;
  const slug = (zone.tenants as unknown as { slug: string } | null)?.slug;
  return slug ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const slug = await resolveTenantSlug(id);
  if (!slug) {
    return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
  }

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const patch = Object.fromEntries(
    ALLOWED_FIELDS.filter((f: AllowedField) => f in body).map((f) => [
      f,
      body[f],
    ]),
  );

  if ("name" in patch) {
    if (
      typeof patch.name !== "string" ||
      (patch.name as string).trim().length === 0 ||
      (patch.name as string).length > NAME_MAX
    ) {
      return NextResponse.json(
        { error: `Nombre inválido (máx. ${NAME_MAX} caracteres)` },
        { status: 400 },
      );
    }
    patch.name = (patch.name as string).trim();
  }
  if ("price" in patch) {
    const v = patch.price;
    if (typeof v !== "number" || !isFinite(v) || v < 0 || v > MAX_PRICE) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
  }
  if ("active" in patch && typeof patch.active !== "boolean") {
    return NextResponse.json(
      { error: "active debe ser boolean" },
      { status: 400 },
    );
  }
  if ("sort_order" in patch && typeof patch.sort_order !== "number") {
    return NextResponse.json({ error: "sort_order inválido" }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Sin campos válidos para actualizar" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update(patch)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const slug = await resolveTenantSlug(id);
  if (!slug) {
    return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
  }

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
