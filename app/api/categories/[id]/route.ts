import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

const ALLOWED_FIELDS = ["name", "emoji", "active", "sort_order"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const supabase = createServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();

  if (!category) {
    return NextResponse.json(
      { error: "Categoría no encontrada" },
      { status: 404 },
    );
  }

  const slug = (category.tenants as unknown as { slug: string } | null)?.slug;
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

  const { error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = createServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();

  if (!category) {
    return NextResponse.json(
      { error: "Categoría no encontrada" },
      { status: 404 },
    );
  }

  const slug = (category.tenants as unknown as { slug: string } | null)?.slug;
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

  // No permitir borrar una categoría que todavía tiene productos
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: la categoría tiene productos. Movélos o eliminálos primero.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ ok: true });
}
