import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { logActivity } from "@/lib/activityLog";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "price",
  "image_url",
  "badge",
  "available",
  "sort_order",
  "category_id",
  "extras",
  "addons",
  "option_groups",
  "is_featured",
  "featured_order",
  "stock_quantity",
  "ingredients",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

function isValidOptionList(list: unknown): boolean {
  if (!Array.isArray(list) || list.length > 20) return false;
  return (list as Array<{ name: unknown; price: unknown }>).every(
    (o) =>
      typeof o.name === "string" &&
      o.name.length <= 100 &&
      typeof o.price === "number" &&
      isFinite(o.price) &&
      o.price >= 0 &&
      o.price <= 10_000_000,
  );
}

function isValidIngredientList(list: unknown): boolean {
  if (!Array.isArray(list) || list.length > 30) return false;
  return list.every((s) => typeof s === "string" && s.length <= 60);
}

function isValidOptionGroupList(list: unknown): boolean {
  if (!Array.isArray(list) || list.length > 10) return false;
  return (
    list as Array<{ name: unknown; required: unknown; options: unknown }>
  ).every(
    (g) =>
      typeof g.name === "string" &&
      g.name.length <= 100 &&
      typeof g.required === "boolean" &&
      isValidOptionList(g.options),
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const supabase = createServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "tenant_id, name, available, stock_quantity, category_id, tenants(slug)",
    )
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

  let actorEmail = "desconocido";
  try {
    const { user } = await assertTenantAdmin(slug);
    actorEmail = user.email ?? actorEmail;
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

  // Type & range validation on mutable fields
  if ("name" in patch) {
    if (
      typeof patch.name !== "string" ||
      (patch.name as string).trim().length === 0 ||
      (patch.name as string).length > 200
    ) {
      return NextResponse.json(
        { error: "Nombre inválido (máx. 200 caracteres)" },
        { status: 400 },
      );
    }
  }
  if ("price" in patch) {
    const p = patch.price as unknown;
    if (
      typeof p !== "number" ||
      !isFinite(p as number) ||
      (p as number) < 0 ||
      (p as number) > 10_000_000
    ) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
  }
  if ("badge" in patch && patch.badge !== null) {
    if (
      typeof patch.badge !== "string" ||
      (patch.badge as string).length > 50
    ) {
      return NextResponse.json(
        { error: "Badge inválido (máx. 50 caracteres)" },
        { status: 400 },
      );
    }
  }
  if ("description" in patch && patch.description !== null) {
    if (
      typeof patch.description !== "string" ||
      (patch.description as string).length > 1000
    ) {
      return NextResponse.json(
        { error: "Descripción demasiado larga (máx. 1000 caracteres)" },
        { status: 400 },
      );
    }
  }
  if ("is_featured" in patch) {
    if (typeof patch.is_featured !== "boolean") {
      return NextResponse.json(
        { error: "is_featured debe ser boolean" },
        { status: 400 },
      );
    }
  }

  // Si se activa is_featured, desmarcar todos los demás del mismo tenant (un solo destacado)
  if (patch.is_featured === true) {
    const { data: productRow } = await supabase
      .from("products")
      .select("tenant_id")
      .eq("id", id)
      .maybeSingle();
    if (productRow?.tenant_id) {
      await supabase
        .from("products")
        .update({ is_featured: false })
        .eq("tenant_id", productRow.tenant_id)
        .neq("id", id);
    }
  }
  if ("featured_order" in patch) {
    const fo = patch.featured_order as unknown;
    if (
      typeof fo !== "number" ||
      !isFinite(fo as number) ||
      (fo as number) < 0
    ) {
      return NextResponse.json(
        { error: "featured_order inválido" },
        { status: 400 },
      );
    }
  }
  if (
    "extras" in patch &&
    patch.extras !== null &&
    !isValidOptionList(patch.extras)
  ) {
    return NextResponse.json(
      { error: "Opciones de tamaño inválidas (máx. 20)" },
      { status: 400 },
    );
  }
  if (
    "addons" in patch &&
    patch.addons !== null &&
    !isValidOptionList(patch.addons)
  ) {
    return NextResponse.json(
      { error: "Extras inválidos (máx. 20)" },
      { status: 400 },
    );
  }
  if (
    "option_groups" in patch &&
    patch.option_groups !== null &&
    !isValidOptionGroupList(patch.option_groups)
  ) {
    return NextResponse.json(
      {
        error: "Grupos de opciones inválidos (máx. 10 grupos, 20 opciones c/u)",
      },
      { status: 400 },
    );
  }
  if ("ingredients" in patch && !isValidIngredientList(patch.ingredients)) {
    return NextResponse.json(
      { error: "Ingredientes inválidos (máx. 30, 60 caracteres c/u)" },
      { status: 400 },
    );
  }
  if ("stock_quantity" in patch && patch.stock_quantity !== null) {
    const sq = patch.stock_quantity as unknown;
    if (
      typeof sq !== "number" ||
      !Number.isInteger(sq as number) ||
      (sq as number) < 0
    ) {
      return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
    }
  }

  const { error } = await supabase.from("products").update(patch).eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  if ("available" in patch) {
    void logActivity({
      tenantId: product.tenant_id,
      actorEmail,
      action: "product.availability_toggled",
      entityType: "product",
      entityId: id,
      metadata: {
        name: product.name,
        from: product.available,
        to: patch.available,
      },
    });
  }
  if ("stock_quantity" in patch) {
    void logActivity({
      tenantId: product.tenant_id,
      actorEmail,
      action: "product.stock_updated",
      entityType: "product",
      entityId: id,
      metadata: {
        name: product.name,
        from: product.stock_quantity,
        to: patch.stock_quantity,
      },
    });
  }
  if ("category_id" in patch && patch.category_id !== product.category_id) {
    void logActivity({
      tenantId: product.tenant_id,
      actorEmail,
      action: "product.category_changed",
      entityType: "product",
      entityId: id,
      metadata: {
        name: product.name,
        from: product.category_id,
        to: patch.category_id,
      },
    });
  }

  revalidatePath(`/${slug}`, "layout");
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
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  const { data: leftoverFiles } = await supabase.storage
    .from("product-images")
    .list(slug, { search: id });
  if (leftoverFiles?.length) {
    await supabase.storage
      .from("product-images")
      .remove(leftoverFiles.map((f) => `${slug}/${f.name}`));
  }

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ ok: true });
}
