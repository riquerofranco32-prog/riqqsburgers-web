import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "./supabase";
import type { Tenant, Category, Product, DeliveryZone } from "@/types/supabase";

export type { Tenant };

// Admin use: finds tenant regardless of active status
export async function getTenant(slug: string): Promise<Tenant | null> {
  noStore();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tenant;
}

// Public use: only returns tenant if active = true
export async function getActiveTenant(slug: string): Promise<Tenant | null> {
  noStore();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tenant;
}

export async function getAllTenants() {
  noStore();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, slug, name, tagline, active, primary_color, logo_url, whatsapp_number, created_at",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export interface TenantWithStats {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  active: boolean;
  primary_color: string | null;
  logo_url: string | null;
  whatsapp_number: string;
  created_at: string;
  plan: string;
  subscriptionStatus: string;
  trialDaysLeft: number | null;
  productCount: number;
  orderCount: number;
  lastOrderAt: string | null;
}

// Admin use: lista de tenants con plan, días de trial restantes, cantidad
// de productos y actividad de pedidos — para el panel /admin/restaurants.
export async function getAllTenantsWithStats(): Promise<TenantWithStats[]> {
  noStore();
  const supabase = createServerClient();

  const [
    { data: tenants },
    { data: subs },
    { data: products },
    { data: orders },
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, slug, name, tagline, active, primary_color, logo_url, whatsapp_number, created_at, plan",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("tenant_id, plan, status, current_period_end"),
    supabase.from("products").select("tenant_id"),
    supabase.from("orders").select("tenant_id, created_at"),
  ]);

  if (!tenants) return [];

  const subByTenant = new Map((subs ?? []).map((s) => [s.tenant_id, s]));

  const productCountByTenant = new Map<string, number>();
  for (const p of products ?? []) {
    productCountByTenant.set(
      p.tenant_id,
      (productCountByTenant.get(p.tenant_id) ?? 0) + 1,
    );
  }

  const orderCountByTenant = new Map<string, number>();
  const lastOrderByTenant = new Map<string, string>();
  for (const o of orders ?? []) {
    orderCountByTenant.set(
      o.tenant_id,
      (orderCountByTenant.get(o.tenant_id) ?? 0) + 1,
    );
    const prev = lastOrderByTenant.get(o.tenant_id);
    if (!prev || o.created_at > prev)
      lastOrderByTenant.set(o.tenant_id, o.created_at);
  }

  return tenants.map((t) => {
    const sub = subByTenant.get(t.id);
    const trialDaysLeft =
      sub?.status === "trialing" && sub.current_period_end
        ? Math.max(
            0,
            Math.ceil(
              (new Date(sub.current_period_end).getTime() - Date.now()) /
                86_400_000,
            ),
          )
        : null;

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      active: t.active,
      primary_color: t.primary_color,
      logo_url: t.logo_url,
      whatsapp_number: t.whatsapp_number,
      created_at: t.created_at,
      plan: sub?.plan ?? t.plan,
      subscriptionStatus: sub?.status ?? "active",
      trialDaysLeft,
      productCount: productCountByTenant.get(t.id) ?? 0,
      orderCount: orderCountByTenant.get(t.id) ?? 0,
      lastOrderAt: lastOrderByTenant.get(t.id) ?? null,
    };
  });
}

export async function getTenantProducts(tenantId: string): Promise<Product[]> {
  noStore();
  const supabase = createServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("available", true)
    .order("sort_order");
  return (data ?? []) as Product[];
}

export async function getTenantCategories(
  tenantId: string,
): Promise<Category[]> {
  noStore();
  const supabase = createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as Category[];
}

export async function getTenantDeliveryZones(
  tenantId: string,
): Promise<DeliveryZone[]> {
  noStore();
  const supabase = createServerClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as DeliveryZone[];
}
