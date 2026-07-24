import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertSuperAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await assertSuperAdmin();
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const { id } = await params;
  const body = (await req.json()) as { active: boolean };
  const supabase = createServerClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("tenants")
    .update({ active: body.active })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  void logActivity({
    tenantId: id,
    actorEmail: user.email ?? "superadmin",
    action: body.active ? "tenant.reactivated" : "tenant.deactivated",
    entityType: "tenant",
    entityId: tenant?.slug ?? id,
  });

  if (tenant?.slug) revalidatePath(`/${tenant.slug}`, "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  if (tenant?.slug) revalidatePath(`/${tenant.slug}`, "layout");
  return NextResponse.json({ ok: true });
}
