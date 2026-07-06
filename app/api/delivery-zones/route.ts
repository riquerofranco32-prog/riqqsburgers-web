import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const NAME_MAX = 60;
const MAX_PRICE = 1_000_000;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    name: string;
    price: number;
    active?: boolean;
    sort_order?: number;
  };

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }
  if (
    typeof body.name !== "string" ||
    body.name.trim().length === 0 ||
    body.name.length > NAME_MAX
  ) {
    return NextResponse.json(
      { error: `Nombre inválido (máx. ${NAME_MAX} caracteres)` },
      { status: 400 },
    );
  }
  if (
    typeof body.price !== "number" ||
    !isFinite(body.price) ||
    body.price < 0 ||
    body.price > MAX_PRICE
  ) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(body.slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      price: body.price,
      active: body.active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
