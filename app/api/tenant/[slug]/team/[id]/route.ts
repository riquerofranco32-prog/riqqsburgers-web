import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  let tenantId: string;
  try {
    ({ tenantId } = await assertTenantAdmin(slug));
  } catch (e) {
    return e as NextResponse;
  }

  const db = createServerClient();

  const { data: member } = await db
    .from("tenant_users")
    .select("role")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "Miembro no encontrado" },
      { status: 404 },
    );
  }

  if (member.role === "admin") {
    const { count } = await db
      .from("tenant_users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "No podés quitar al último administrador del equipo" },
        { status: 400 },
      );
    }
  }

  const { error } = await db.from("tenant_users").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
