import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "price",
  "image_url",
  "badge",
  "available",
  "sort_order",
  "category_id",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const supabase = createServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 },
    );
  }

  const slug = (product.tenants as unknown as { slug: string } | null)?.slug;
  if (!slug) {
    return NextResponse.json(
      { error: "Tenant no encontrado" },
      { status: 404 },
    );
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

  const { error } = await supabase.from("products").update(patch).eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/${slug}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = createServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 },
    );
  }

  const slug = (product.tenants as unknown as { slug: string } | null)?.slug;
  if (!slug) {
    return NextResponse.json(
      { error: "Tenant no encontrado" },
      { status: 404 },
    );
  }

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/${slug}`);
  return NextResponse.json({ ok: true });
}
