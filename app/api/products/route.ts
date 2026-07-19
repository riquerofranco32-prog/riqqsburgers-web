import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { canAddProduct } from "@/lib/subscriptions";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

function isValidOptionList(list: unknown): list is Array<{
  name: string;
  price: number;
}> {
  if (!Array.isArray(list) || list.length > 20) return false;
  return list.every(
    (o) =>
      typeof o.name === "string" &&
      o.name.length <= 100 &&
      typeof o.price === "number" &&
      isFinite(o.price) &&
      o.price >= 0 &&
      o.price <= 10_000_000,
  );
}

function isValidIngredientList(list: unknown): list is string[] {
  if (!Array.isArray(list) || list.length > 30) return false;
  return list.every((s) => typeof s === "string" && s.length <= 60);
}

interface OptionGroupInput {
  name: string;
  required: boolean;
  options: Array<{ name: string; price: number }>;
}

function isValidOptionGroupList(list: unknown): list is OptionGroupInput[] {
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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    name: string;
    description?: string | null;
    price: number;
    category_id?: string | null;
    badge?: string | null;
    image_url?: string | null;
    available?: boolean;
    sort_order?: number;
    is_featured?: boolean;
    featured_order?: number;
    extras?: Array<{ name: string; price: number }>;
    addons?: Array<{ name: string; price: number }>;
    option_groups?: OptionGroupInput[];
    stock_quantity?: number | null;
    ingredients?: string[];
  };

  if (!body.slug || !body.name || body.price === undefined) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  if (
    typeof body.name !== "string" ||
    body.name.trim().length === 0 ||
    body.name.length > 200
  ) {
    return NextResponse.json(
      { error: "Nombre inválido (máx. 200 caracteres)" },
      { status: 400 },
    );
  }

  if (
    typeof body.price !== "number" ||
    !isFinite(body.price) ||
    body.price < 0 ||
    body.price > 10_000_000
  ) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  if (body.badge !== undefined && body.badge !== null) {
    if (typeof body.badge !== "string" || body.badge.length > 50) {
      return NextResponse.json(
        { error: "Badge inválido (máx. 50 caracteres)" },
        { status: 400 },
      );
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (
      typeof body.description !== "string" ||
      body.description.length > 1000
    ) {
      return NextResponse.json(
        { error: "Descripción demasiado larga (máx. 1000 caracteres)" },
        { status: 400 },
      );
    }
  }

  if (
    body.extras !== undefined &&
    body.extras !== null &&
    !isValidOptionList(body.extras)
  ) {
    return NextResponse.json(
      { error: "Opciones de tamaño inválidas (máx. 20)" },
      { status: 400 },
    );
  }

  if (
    body.addons !== undefined &&
    body.addons !== null &&
    !isValidOptionList(body.addons)
  ) {
    return NextResponse.json(
      { error: "Extras inválidos (máx. 20)" },
      { status: 400 },
    );
  }

  if (
    body.option_groups !== undefined &&
    body.option_groups !== null &&
    !isValidOptionGroupList(body.option_groups)
  ) {
    return NextResponse.json(
      {
        error: "Grupos de opciones inválidos (máx. 10 grupos, 20 opciones c/u)",
      },
      { status: 400 },
    );
  }

  if (
    body.ingredients !== undefined &&
    body.ingredients !== null &&
    !isValidIngredientList(body.ingredients)
  ) {
    return NextResponse.json(
      { error: "Ingredientes inválidos (máx. 30, 60 caracteres c/u)" },
      { status: 400 },
    );
  }

  if (body.stock_quantity !== undefined && body.stock_quantity !== null) {
    if (
      typeof body.stock_quantity !== "number" ||
      !Number.isInteger(body.stock_quantity) ||
      body.stock_quantity < 0
    ) {
      return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
    }
  }

  let tenantId: string;
  let isSuperAdmin: boolean;
  try {
    const result = await assertTenantAdmin(body.slug);
    tenantId = result.tenantId;
    isSuperAdmin = result.isSuperAdmin;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  // Gating por plan — verificación server-side
  const { allowed, max } = await canAddProduct(tenantId);
  if (!allowed && !isSuperAdmin) {
    const planLabel =
      max === PLANS.free.maxProducts
        ? `Plan Free permite hasta ${PLANS.free.maxProducts} productos`
        : max === PLANS.pro.maxProducts
          ? `Plan Pro permite hasta ${PLANS.pro.maxProducts} productos`
          : `tu plan actual permite hasta ${max} productos`;
    return NextResponse.json(
      {
        error: `Límite de productos alcanzado. Tu ${planLabel}. Actualizá tu plan para agregar más.`,
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 403 },
    );
  }

  const supabase = createServerClient();

  // Si se crea como featured, desmarcar todos los anteriores del tenant
  if (body.is_featured) {
    await supabase
      .from("products")
      .update({ is_featured: false })
      .eq("tenant_id", tenantId);
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      category_id: body.category_id ?? null,
      badge: body.badge ?? null,
      image_url: body.image_url ?? null,
      available: body.available ?? true,
      sort_order: body.sort_order ?? 0,
      is_featured: body.is_featured ?? false,
      featured_order: body.featured_order ?? 0,
      extras: body.extras ?? [],
      addons: body.addons ?? [],
      option_groups: body.option_groups ?? [],
      stock_quantity: body.stock_quantity ?? null,
      ingredients: body.ingredients ?? [],
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  revalidatePath(`/${body.slug}`, "layout");
  return NextResponse.json(data, { status: 201 });
}
