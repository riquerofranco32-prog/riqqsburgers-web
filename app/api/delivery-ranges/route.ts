import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const MAX_PRICE = 1_000_000;
const MAX_KM = 200;

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
    .from("delivery_ranges")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("max_km");

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    max_km: number;
    price: number;
    active?: boolean;
  };

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }
  if (
    typeof body.max_km !== "number" ||
    !isFinite(body.max_km) ||
    body.max_km <= 0 ||
    body.max_km > MAX_KM
  ) {
    return NextResponse.json(
      { error: "Distancia máxima inválida" },
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

  const { data: existing } = await supabase
    .from("delivery_ranges")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("max_km", body.max_km)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un rango con esa distancia máxima" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("delivery_ranges")
    .insert({
      tenant_id: tenantId,
      max_km: body.max_km,
      price: body.price,
      active: body.active ?? true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
