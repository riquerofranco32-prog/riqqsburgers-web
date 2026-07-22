import { cache } from "react";
import { unstable_cache, unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "./supabase";
import type { Tenant, Category, Product, DeliveryZone } from "@/types/supabase";

export type { Tenant };

// Admin use: finds tenant regardless of active status.
// cache() dedupea la consulta dentro del mismo request (layouts + page).
export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  noStore();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tenant;
});

// slug → id, cacheado ENTRE requests (el mapeo es estable: el slug de un
// tenant no cambia). Ahorra un roundtrip a Supabase en cada navegación del
// admin para páginas que solo necesitan el id.
export const getTenantId = unstable_cache(
  async (slug: string): Promise<string | null> => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    return data?.id ?? null;
  },
  ["tenant-id-by-slug"],
  { revalidate: 3600 },
);

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
  banner_url: string | null;
  whatsapp_number: string;
  created_at: string;
  plan: string;
  subscriptionStatus: string;
  // Días restantes hasta current_period_end — cubre tanto un trial
  // ("trialing") como un plan pago con vencimiento fijo ("active").
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
        "id, slug, name, tagline, active, primary_color, logo_url, banner_url, whatsapp_number, created_at, plan",
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
    const isCountingDown =
      (sub?.status === "trialing" || sub?.status === "active") &&
      sub.plan !== "free" &&
      sub.current_period_end;
    const trialDaysLeft = isCountingDown
      ? Math.max(
          0,
          Math.ceil(
            (new Date(sub.current_period_end as string).getTime() -
              Date.now()) /
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
      banner_url: t.banner_url,
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

export interface TenantTeamMember {
  id: string;
  email: string | null;
  role: string;
  display_name: string | null;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

// Admin use: todos los miembros de equipo de todos los tenants, para el
// panel /admin/team — deja ver y quitar accesos sin entrar tenant por tenant.
export async function getAllTeamMembersAcrossTenants(): Promise<
  TenantTeamMember[]
> {
  noStore();
  const supabase = createServerClient();

  const [{ data: members }, { data: tenants }] = await Promise.all([
    supabase
      .from("tenant_users")
      .select("id, email, role, display_name, tenant_id")
      .neq("role", "superadmin"),
    supabase.from("tenants").select("id, slug, name"),
  ]);

  const tenantById = new Map((tenants ?? []).map((t) => [t.id, t]));

  return (members ?? []).flatMap((m) => {
    const tenant = tenantById.get(m.tenant_id);
    if (!tenant) return [];
    return [
      {
        id: m.id,
        email: m.email,
        role: m.role,
        display_name: m.display_name,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
      },
    ];
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

// --- Community: Explore page data ---

export interface TenantPreview {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  address: string | null;
  is_open: boolean;
  business_hours: import("./businessHours").BusinessHours | null;
  delivery_mode: "none" | "fixed" | "zones" | "distance";
  tags: string[];
  productCount: number;
  rating: { avg: number; count: number } | null;
  activeCoupons: number;
}

const MIN_REVIEWS_FOR_PREVIEW = 3;

export async function getAllActiveTenantsWithPreview(): Promise<
  TenantPreview[]
> {
  noStore();
  const supabase = createServerClient();

  const [
    { data: tenants },
    { data: products },
    { data: reviews },
    { data: coupons },
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, slug, name, tagline, logo_url, banner_url, primary_color, address, is_open, business_hours, delivery_mode, tags",
      )
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase.from("products").select("tenant_id").eq("available", true),
    supabase.from("reviews").select("tenant_id, rating"),
    supabase
      .from("coupons")
      .select("tenant_id")
      .eq("active", true)
      .eq("show_in_menu", true),
  ]);

  if (!tenants) return [];

  // Product counts per tenant
  const productCountMap = new Map<string, number>();
  for (const p of products ?? []) {
    productCountMap.set(
      p.tenant_id,
      (productCountMap.get(p.tenant_id) ?? 0) + 1,
    );
  }

  // Rating aggregation per tenant
  const reviewsByTenant = new Map<string, number[]>();
  for (const r of reviews ?? []) {
    const arr = reviewsByTenant.get(r.tenant_id) ?? [];
    arr.push(r.rating as number);
    reviewsByTenant.set(r.tenant_id, arr);
  }

  // Active coupon counts per tenant
  const couponCountMap = new Map<string, number>();
  for (const c of coupons ?? []) {
    couponCountMap.set(c.tenant_id, (couponCountMap.get(c.tenant_id) ?? 0) + 1);
  }

  return tenants.map((t) => {
    const ratings = reviewsByTenant.get(t.id);
    const rating =
      ratings && ratings.length >= MIN_REVIEWS_FOR_PREVIEW
        ? {
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
          }
        : null;

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      logo_url: t.logo_url,
      banner_url: t.banner_url,
      primary_color: t.primary_color,
      address: t.address,
      is_open: t.is_open,
      business_hours: t.business_hours as
        import("./businessHours").BusinessHours | null,
      delivery_mode: t.delivery_mode ?? "none",
      tags: (t.tags as string[]) ?? [],
      productCount: productCountMap.get(t.id) ?? 0,
      rating,
      activeCoupons: couponCountMap.get(t.id) ?? 0,
    };
  });
}
