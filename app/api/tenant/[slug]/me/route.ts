import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantStaff } from "@/lib/authz";

const MAX_NAME = 60;

/** Auto-servicio: cada miembro (admin o staff) edita su propio nombre visible. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = (await req.json()) as { display_name?: string | null };

  const trimmed = body.display_name?.trim() ?? "";
  if (trimmed.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Nombre demasiado largo (máx. ${MAX_NAME} caracteres)` },
      { status: 400 },
    );
  }

  let user, tenantId: string;
  try {
    ({ user, tenantId } = await assertTenantStaff(slug));
  } catch (e) {
    return e as NextResponse;
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("tenant_users")
    .update({ display_name: trimmed || null })
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    // Caso superadmin viendo un tenant donde no tiene fila propia en
    // tenant_users — no hay dónde guardar el nombre para este negocio.
    return NextResponse.json(
      { error: "No tenés un perfil de equipo en este negocio" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, display_name: trimmed || null });
}
