import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertSuperAdmin } from "@/lib/authz";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
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
  } catch (e) {
    return e as NextResponse;
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...body, tenant_id: id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
