import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const ALLOWED_FIELDS = ["max_km", "price", "active"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

const MAX_PRICE = 1_000_000;
const MAX_KM = 200;

async function resolveTenant(id: string) {
  const supabase = createServerClient();
  const { data: range } = await supabase
    .from("delivery_ranges")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!range) return null;
  const slug = (range.tenants as unknown as { slug: string } | null)?.slug;
  return slug ? { slug, tenantId: range.tenant_id as string } : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const resolved = await resolveTenant(id);
  if (!resolved) {
    return NextResponse.json({ error: "Rango no encontrado" }, { status: 404 });
  }

  try {
    await assertTenantAdmin(resolved.slug);
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

  if ("max_km" in patch) {
    const v = patch.max_km;
    if (typeof v !== "number" || !isFinite(v) || v <= 0 || v > MAX_KM) {
      return NextResponse.json(
        { error: "Distancia máxima inválida" },
        { status: 400 },
      );
    }
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

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Sin campos válidos para actualizar" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  if ("max_km" in patch) {
    const { data: existing } = await supabase
      .from("delivery_ranges")
      .select("id")
      .eq("tenant_id", resolved.tenantId)
      .eq("max_km", patch.max_km as number)
      .neq("id", id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un rango con esa distancia máxima" },
        { status: 409 },
      );
    }
  }

  const { error } = await supabase
    .from("delivery_ranges")
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

  const resolved = await resolveTenant(id);
  if (!resolved) {
    return NextResponse.json({ error: "Rango no encontrado" }, { status: 404 });
  }

  try {
    await assertTenantAdmin(resolved.slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("delivery_ranges")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
