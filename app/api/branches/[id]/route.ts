import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { validateBranchInput } from "@/lib/branchValidation";

const ALLOWED_FIELDS = [
  "name",
  "latitude",
  "longitude",
  "delivery_mode",
  "active",
] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

async function resolveTenant(id: string) {
  const supabase = createServerClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!branch) return null;
  const slug = (branch.tenants as unknown as { slug: string } | null)?.slug;
  return slug ? { slug, tenantId: branch.tenant_id as string } : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const resolved = await resolveTenant(id);
  if (!resolved) {
    return NextResponse.json(
      { error: "Sucursal no encontrada" },
      { status: 404 },
    );
  }

  try {
    await assertTenantAdmin(resolved.slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const patch = Object.fromEntries(
    ALLOWED_FIELDS.filter((f: AllowedField) => f in body).map((f) => [
      f,
      body[f],
    ]),
  );

  const validationError = validateBranchInput(patch);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if ("name" in patch) patch.name = (patch.name as string).trim();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Sin campos válidos para actualizar" },
      { status: 400 },
    );
  }

  // No permitir desactivar la última sucursal activa: assignBranch() se
  // queda sin candidatos y los pedidos nuevos dejan de poder asignarse.
  if (patch.active === false) {
    const supabase = createServerClient();
    const { count } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", resolved.tenantId)
      .eq("active", true)
      .neq("id", id);
    if (!count) {
      return NextResponse.json(
        { error: "No podés desactivar la única sucursal activa" },
        { status: 409 },
      );
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("branches").update(patch).eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const resolved = await resolveTenant(id);
  if (!resolved) {
    return NextResponse.json(
      { error: "Sucursal no encontrada" },
      { status: 404 },
    );
  }

  try {
    await assertTenantAdmin(resolved.slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();

  // Nunca te quedes sin sucursales: si es la única del tenant, no se borra.
  const { count } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", resolved.tenantId)
    .neq("id", id);
  if (!count) {
    return NextResponse.json(
      { error: "No podés eliminar la única sucursal" },
      { status: 409 },
    );
  }

  // orders.branch_id no tiene ON DELETE CASCADE (a propósito, ver migración
  // 20260716_add_branches_table.sql) — si hay pedidos históricos contra esta
  // sucursal, Postgres rechaza el delete y safeDbError lo traduce a 23503.
  const { error } = await supabase.from("branches").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
