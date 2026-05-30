import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
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
  };

  if (!body.slug || !body.name || body.price === undefined) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
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
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/${body.slug}`);
  return NextResponse.json(data, { status: 201 });
}
