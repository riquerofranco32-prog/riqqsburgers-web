import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const CODE_MAX = 30;
const MAX_DISCOUNT_VALUE = 1_000_000;

function isValidCouponBody(body: {
  code?: unknown;
  discount_type?: unknown;
  discount_value?: unknown;
  min_order_amount?: unknown;
  max_uses?: unknown;
  expires_at?: unknown;
}): string | null {
  if (
    typeof body.code !== "string" ||
    body.code.trim().length === 0 ||
    body.code.length > CODE_MAX
  ) {
    return `Código inválido (máx. ${CODE_MAX} caracteres)`;
  }
  if (body.discount_type !== "percent" && body.discount_type !== "fixed") {
    return "Tipo de descuento inválido";
  }
  const value = body.discount_value;
  if (
    typeof value !== "number" ||
    !isFinite(value) ||
    value <= 0 ||
    value > MAX_DISCOUNT_VALUE ||
    (body.discount_type === "percent" && value > 100)
  ) {
    return "Valor de descuento inválido";
  }
  if (body.min_order_amount !== undefined && body.min_order_amount !== null) {
    if (
      typeof body.min_order_amount !== "number" ||
      !isFinite(body.min_order_amount) ||
      body.min_order_amount < 0
    ) {
      return "Pedido mínimo inválido";
    }
  }
  if (body.max_uses !== undefined && body.max_uses !== null) {
    if (
      typeof body.max_uses !== "number" ||
      !Number.isInteger(body.max_uses) ||
      body.max_uses < 1
    ) {
      return "Cantidad de usos inválida";
    }
  }
  if (body.expires_at !== undefined && body.expires_at !== null) {
    if (
      typeof body.expires_at !== "string" ||
      isNaN(Date.parse(body.expires_at))
    ) {
      return "Fecha de vencimiento inválida";
    }
  }
  return null;
}

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
    .from("coupons")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    min_order_amount?: number | null;
    max_uses?: number | null;
    active?: boolean;
    expires_at?: string | null;
  };

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  const validationError = isValidCouponBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
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
    .from("coupons")
    .insert({
      tenant_id: tenantId,
      code: body.code.trim().toUpperCase(),
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      min_order_amount: body.min_order_amount ?? null,
      max_uses: body.max_uses ?? null,
      active: body.active ?? true,
      expires_at: body.expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un cupón con ese código" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
