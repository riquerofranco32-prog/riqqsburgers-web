import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { canAddProduct } from "@/lib/subscriptions";
import { PLANS } from "@/lib/plans";

const MAX_BULK = 100;

interface BulkProductInput {
  name: string;
  description?: string | null;
  price: number;
  category_id?: string | null;
  badge?: string | null;
}

function isValidProduct(p: unknown): p is BulkProductInput {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    o.name.trim().length > 0 &&
    o.name.length <= 200 &&
    typeof o.price === "number" &&
    isFinite(o.price) &&
    o.price >= 0 &&
    o.price <= 10_000_000 &&
    (o.description === undefined ||
      o.description === null ||
      (typeof o.description === "string" && o.description.length <= 1000)) &&
    (o.category_id === undefined ||
      o.category_id === null ||
      typeof o.category_id === "string") &&
    (o.badge === undefined ||
      o.badge === null ||
      (typeof o.badge === "string" && o.badge.length <= 50))
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    products: unknown[];
  };

  if (
    !body.slug ||
    !Array.isArray(body.products) ||
    body.products.length === 0
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }
  if (body.products.length > MAX_BULK) {
    return NextResponse.json(
      { error: `Máximo ${MAX_BULK} productos por carga` },
      { status: 400 },
    );
  }
  if (!body.products.every(isValidProduct)) {
    return NextResponse.json(
      { error: "Uno o más productos tienen datos inválidos" },
      { status: 400 },
    );
  }
  const products = body.products as BulkProductInput[];

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(body.slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const { current, max } = await canAddProduct(tenantId);
  if (max !== null && current + products.length > max) {
    const planLabel =
      max === PLANS.free.maxProducts
        ? `Plan Free permite hasta ${PLANS.free.maxProducts} productos`
        : max === PLANS.pro.maxProducts
          ? `Plan Pro permite hasta ${PLANS.pro.maxProducts} productos`
          : `tu plan actual permite hasta ${max} productos`;
    return NextResponse.json(
      {
        error: `${planLabel}. Tenés ${current} y estás cargando ${products.length}. Actualizá tu plan o cargá menos productos.`,
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 403 },
    );
  }
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("products")
    .insert(
      products.map((p, i) => ({
        tenant_id: tenantId,
        name: p.name,
        description: p.description ?? null,
        price: p.price,
        category_id: p.category_id ?? null,
        badge: p.badge ?? null,
        available: true,
        sort_order: current + i,
      })),
    )
    .select();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  revalidatePath(`/${body.slug}`, "layout");
  return NextResponse.json({ products: data }, { status: 201 });
}
