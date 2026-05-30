import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

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

  // Mirror the layout check: direct tenant membership OR superadmin
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

  if (!directAccess && !superAdmin) {
    throw NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { user, tenantId: tenant.id };
}
