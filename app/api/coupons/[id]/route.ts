import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const ALLOWED_FIELDS = [
  "code",
  "discount_type",
  "discount_value",
  "min_order_amount",
  "max_uses",
  "active",
  "show_in_menu",
  "starts_at",
  "expires_at",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

const CODE_MAX = 30;
const MAX_DISCOUNT_VALUE = 1_000_000;

async function resolveTenantSlug(id: string) {
  const supabase = createServerClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!coupon) return null;
  const slug = (coupon.tenants as unknown as { slug: string } | null)?.slug;
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
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
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

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Sin campos válidos para actualizar" },
      { status: 400 },
    );
  }

  if ("code" in patch) {
    if (
      typeof patch.code !== "string" ||
      (patch.code as string).trim().length === 0 ||
      (patch.code as string).length > CODE_MAX
    ) {
      return NextResponse.json(
        { error: `Código inválido (máx. ${CODE_MAX} caracteres)` },
        { status: 400 },
      );
    }
    patch.code = (patch.code as string).trim().toUpperCase();
  }
  if ("discount_type" in patch) {
    if (patch.discount_type !== "percent" && patch.discount_type !== "fixed") {
      return NextResponse.json(
        { error: "Tipo de descuento inválido" },
        { status: 400 },
      );
    }
  }
  if ("discount_value" in patch) {
    const v = patch.discount_value;
    if (
      typeof v !== "number" ||
      !isFinite(v) ||
      v <= 0 ||
      v > MAX_DISCOUNT_VALUE ||
      (patch.discount_type === "percent" && v > 100)
    ) {
      return NextResponse.json(
        { error: "Valor de descuento inválido" },
        { status: 400 },
      );
    }
  }
  if ("min_order_amount" in patch && patch.min_order_amount !== null) {
    if (
      typeof patch.min_order_amount !== "number" ||
      !isFinite(patch.min_order_amount) ||
      patch.min_order_amount < 0
    ) {
      return NextResponse.json(
        { error: "Pedido mínimo inválido" },
        { status: 400 },
      );
    }
  }
  if ("max_uses" in patch && patch.max_uses !== null) {
    if (
      typeof patch.max_uses !== "number" ||
      !Number.isInteger(patch.max_uses) ||
      patch.max_uses < 1
    ) {
      return NextResponse.json(
        { error: "Cantidad de usos inválida" },
        { status: 400 },
      );
    }
  }
  if ("active" in patch && typeof patch.active !== "boolean") {
    return NextResponse.json(
      { error: "active debe ser boolean" },
      { status: 400 },
    );
  }
  if ("show_in_menu" in patch && typeof patch.show_in_menu !== "boolean") {
    return NextResponse.json(
      { error: "show_in_menu debe ser boolean" },
      { status: 400 },
    );
  }
  if ("starts_at" in patch && patch.starts_at !== null) {
    if (
      typeof patch.starts_at !== "string" ||
      isNaN(Date.parse(patch.starts_at))
    ) {
      return NextResponse.json(
        { error: "Fecha de inicio inválida" },
        { status: 400 },
      );
    }
  }
  if ("expires_at" in patch && patch.expires_at !== null) {
    if (
      typeof patch.expires_at !== "string" ||
      isNaN(Date.parse(patch.expires_at))
    ) {
      return NextResponse.json(
        { error: "Fecha de vencimiento inválida" },
        { status: 400 },
      );
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("coupons").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un cupón con ese código" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const slug = await resolveTenantSlug(id);
  if (!slug) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
  }

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
