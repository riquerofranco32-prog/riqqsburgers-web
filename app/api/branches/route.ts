import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { validateBranchInput } from "@/lib/branchValidation";

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
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at");

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    delivery_mode?: string;
    active?: boolean;
  };

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  const validationError = validateBranchInput({
    name: body.name,
    ...("latitude" in body ? { latitude: body.latitude } : {}),
    ...("longitude" in body ? { longitude: body.longitude } : {}),
    ...("delivery_mode" in body ? { delivery_mode: body.delivery_mode } : {}),
  });
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
    .from("branches")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      delivery_mode: body.delivery_mode ?? "none",
      active: body.active ?? true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
