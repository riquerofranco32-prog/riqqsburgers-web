import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { canAddProduct } from "@/lib/subscriptions";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

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

  if (body.extras !== undefined && body.extras !== null) {
    if (!Array.isArray(body.extras) || body.extras.length > 20) {
      return NextResponse.json(
        { error: "extras inválido (máx. 20 opciones)" },
        { status: 400 },
      );
    }
    for (const extra of body.extras) {
      if (
        typeof extra.name !== "string" ||
        extra.name.length > 100 ||
        typeof extra.price !== "number" ||
        !isFinite(extra.price) ||
        extra.price < 0 ||
        extra.price > 10_000_000
      ) {
        return NextResponse.json(
          { error: "Extra inválido en extras" },
          { status: 400 },
        );
      }
    }
  }

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(body.slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  // Gating por plan — verificación server-side
  const { allowed, max } = await canAddProduct(tenantId);
  if (!allowed) {
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
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  revalidatePath(`/${body.slug}`, "layout");
  return NextResponse.json(data, { status: 201 });
}
