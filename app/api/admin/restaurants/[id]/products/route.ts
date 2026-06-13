import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertSuperAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertSuperAdmin();
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", id)
    .order("sort_order");
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertSuperAdmin();
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = createServerClient();

  const ALLOWED_FIELDS = [
    "name",
    "description",
    "price",
    "category_id",
    "badge",
    "image_url",
    "available",
    "sort_order",
    "extras",
  ] as const;
  const patch = Object.fromEntries(
    ALLOWED_FIELDS.filter((f) => f in body).map((f) => [f, body[f]]),
  );

  const { data, error } = await supabase
    .from("products")
    .insert({ ...patch, tenant_id: id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`, "layout");

  return NextResponse.json(data);
}
