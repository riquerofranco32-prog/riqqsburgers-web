import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    emoji?: string | null;
  };

  if (!body.slug || !body.name?.trim()) {
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

  const supabase = createServerClient();

  // sort_order = cantidad actual de categorías → la nueva queda al final
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { data, error } = await supabase
    .from("categories")
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      emoji: body.emoji?.trim() || "🍽️",
      sort_order: count ?? 0,
      active: true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  revalidatePath(`/${body.slug}`, "layout");
  return NextResponse.json(data, { status: 201 });
}
