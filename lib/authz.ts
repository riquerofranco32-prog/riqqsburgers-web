import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/auth";

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

  const supabase = await createAuthClient();
  const { data } = await supabase
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

  const supabase = await createAuthClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    throw NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!membership) {
    throw NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { user, tenantId: tenant.id };
}
