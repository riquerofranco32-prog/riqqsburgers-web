import { cache } from "react";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

// cache() dedupea la llamada de red a Supabase Auth dentro del mismo request
// (admin/layout + (full)/layout + page la piden por separado).
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

// Rol del usuario en un tenant: { direct } = fila en tenant_users del tenant,
// { superadmin } = tiene rol superadmin en cualquier tenant. Deduplicado por
// request — los dos layouts del admin hacían estas mismas 2 consultas cada uno.
export const getTenantRole = cache(
  async (
    userId: string,
    tenantId: string,
  ): Promise<{ direct: string | null; superadmin: boolean }> => {
    const db = createServerClient();
    const [{ data: directAccess }, { data: superAdmin }] = await Promise.all([
      db
        .from("tenant_users")
        .select("role")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      db
        .from("tenant_users")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .limit(1)
        .maybeSingle(),
    ]);
    return { direct: directAccess?.role ?? null, superadmin: !!superAdmin };
  },
);

export async function assertSuperAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = createServerClient();
  const { data } = await db
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "superadmin")
    .maybeSingle();

  if (!data) {
    throw NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return user;
}

export async function assertTenantAdmin(
  slug: string,
): Promise<{ user: User; tenantId: string }> {
  const user = await getSessionUser();
  if (!user) {
    throw NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Use service role to bypass RLS — we verify auth ourselves
  const db = createServerClient();

  const { data: tenant } = await db
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    throw NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Dueño/gerente del tenant (role=admin) O superadmin — NO staff (cocina/mozo)
  const [{ data: directAccess }, { data: superAdmin }] = await Promise.all([
    db
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    db
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .maybeSingle(),
  ]);

  const isAuthorized = directAccess?.role === "admin" || !!superAdmin;
  if (!isAuthorized) {
    throw NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { user, tenantId: tenant.id };
}

/**
 * Acceso de staff (cocina/mozo): igual que assertTenantAdmin pero también
 * acepta role="staff". Usar solo en endpoints que el personal de cocina
 * necesita (estado de pedidos), nunca en productos/config/billing.
 */
export async function assertTenantStaff(
  slug: string,
): Promise<{ user: User; tenantId: string }> {
  const user = await getSessionUser();
  if (!user) {
    throw NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = createServerClient();

  const { data: tenant } = await db
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    throw NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const [{ data: directAccess }, { data: superAdmin }] = await Promise.all([
    db
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    db
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .maybeSingle(),
  ]);

  const isAuthorized =
    (directAccess && ["admin", "staff"].includes(directAccess.role)) ||
    !!superAdmin;

  if (!isAuthorized) {
    throw NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { user, tenantId: tenant.id };
}
