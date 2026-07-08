import fs from "fs/promises";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import {
  getActiveTenant,
  getAllTenants,
  getTenantProducts,
  getTenantCategories,
  getTenantDeliveryZones,
} from "./tenants";
import { createServerClient } from "./supabase";
import { computeEffectiveOpen, type BusinessHours } from "./businessHours";
import { isCategoryVisibleNow } from "./categoryVisibility";
import type {
  Tenant,
  Category,
  Product,
  ProductOptionGroup,
} from "@/types/supabase";

export interface RestaurantBrand {
  bg: string;
  surface: string;
  surface2: string;
  accent: string;
  text_primary: string;
  text_secondary: string;
  border: string;
  display_font: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge: string | null;
  extras: Array<{ name: string; price: number }>;
  addons: Array<{ name: string; price: number }>;
  option_groups: ProductOptionGroup[];
  is_featured: boolean;
  featured_order: number;
  ingredients: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  allow_half: boolean;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  phone: string;
  instagram: string;
  logo: string;
  banner_url: string;
  hero_video_url: string | null;
  accent_color: string;
  primary_color: string;
  delivery_cost: number;
  address: string;
  schedule: string;
  is_open: boolean;
  manual_is_open: boolean;
  business_hours: BusinessHours | null;
  prep_time_minutes: number | null;
  min_order_amount: number | null;
  rating: { avg: number; count: number } | null;
  brand: RestaurantBrand | null;
  latitude: number | null;
  longitude: number | null;
  delivery_mode: "none" | "fixed" | "zones" | "distance";
  delivery_city_hint: string | null;
  delivery_out_of_range_msg: string;
  tags: string[];
  plan: string;
  deliveryZones: Array<{ id: string; name: string; price: number }>;
  menu: {
    categories: MenuCategory[];
  };
}

async function getTopProductId(tenantId: string): Promise<string | null> {
  noStore();
  const supabase = createServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data: orders } = await supabase
    .from("orders")
    .select("items")
    .eq("tenant_id", tenantId)
    .not("items", "is", null)
    .gte("created_at", since.toISOString())
    .limit(500);

  if (!orders || orders.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const order of orders) {
    const items = order.items as Array<{
      product_id: string;
      quantity: number;
    }> | null;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (item.product_id) {
        counts[item.product_id] =
          (counts[item.product_id] ?? 0) + item.quantity;
      }
    }
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

const MIN_REVIEWS_TO_SHOW = 3;

async function getRatingSummary(
  tenantId: string,
): Promise<{ avg: number; count: number } | null> {
  noStore();
  const supabase = createServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("tenant_id", tenantId);
  if (!data || data.length < MIN_REVIEWS_TO_SHOW) return null;
  const sum = data.reduce((s, r) => s + (r.rating as number), 0);
  return { avg: sum / data.length, count: data.length };
}

function mapToRestaurant(
  tenant: Tenant,
  categories: Category[],
  products: Product[],
  topProductId?: string | null,
  ratingSummary?: { avg: number; count: number } | null,
  deliveryZones: Array<{ id: string; name: string; price: number }> = [],
): Restaurant {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    tagline: tenant.tagline ?? "",
    phone: tenant.whatsapp_number,
    instagram: tenant.instagram_handle ?? "",
    logo: tenant.logo_url ?? "",
    banner_url: tenant.banner_url ?? "",
    hero_video_url: tenant.hero_video_url ?? null,
    accent_color: tenant.primary_color ?? "#FF6B35",
    primary_color: tenant.primary_color ?? "#FF6B35",
    delivery_cost: tenant.delivery_cost ?? 0,
    address: tenant.address ?? "",
    schedule: tenant.schedule ?? "",
    // is_open crudo = override manual ("cerrado forzado" cuando es false).
    // El estado real que se muestra sale de computeEffectiveOpen(), que
    // combina esto con business_hours tanto en el primer render (SSR) como
    // en vivo en el cliente.
    is_open: computeEffectiveOpen(
      tenant.is_open ?? true,
      tenant.business_hours ?? null,
    ),
    manual_is_open: tenant.is_open ?? true,
    business_hours: tenant.business_hours ?? null,
    prep_time_minutes: tenant.prep_time_minutes ?? null,
    min_order_amount: tenant.min_order_amount ?? null,
    rating: ratingSummary ?? null,
    brand: (tenant.brand as RestaurantBrand | null) ?? null,
    latitude: tenant.latitude ?? null,
    longitude: tenant.longitude ?? null,
    delivery_mode: tenant.delivery_mode ?? "none",
    delivery_city_hint: tenant.delivery_city_hint ?? null,
    delivery_out_of_range_msg:
      tenant.delivery_out_of_range_msg ??
      "Consultanos por WhatsApp el costo de envío a tu zona",
    tags: tenant.tags ?? [],
    plan: tenant.plan ?? "starter",
    deliveryZones,
    menu: {
      categories: (() => {
        const assignedIds = new Set(categories.map((c) => c.id));
        // Categorías con franja horaria (ej: "Desayuno" 8–12) que no
        // corresponde mostrar ahora se ocultan del todo — sus productos no
        // caen en "Otros", quedan afuera del catálogo hasta su horario.
        const visibleCategories = categories.filter((c) =>
          isCategoryVisibleNow(c),
        );
        const mapped = visibleCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          emoji: cat.emoji ?? "🍽️",
          allow_half: cat.allow_half,
          items: products
            .filter((p) => p.category_id === cat.id && p.available)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description ?? "",
              price: p.price,
              image: p.image_url ?? "",
              badge:
                topProductId && p.id === topProductId && p.badge !== "Agotado"
                  ? "Más pedido"
                  : (p.badge ?? null),
              extras:
                (p.extras as Array<{ name: string; price: number }>) ?? [],
              addons:
                (p.addons as Array<{ name: string; price: number }>) ?? [],
              option_groups: (p.option_groups as ProductOptionGroup[]) ?? [],
              is_featured: p.is_featured ?? false,
              featured_order: p.featured_order ?? 0,
              ingredients: p.ingredients ?? [],
            })),
        }));
        const uncategorized = products
          .filter(
            (p) =>
              p.available &&
              (!p.category_id || !assignedIds.has(p.category_id)),
          )
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            price: p.price,
            image: p.image_url ?? "",
            badge:
              topProductId && p.id === topProductId && p.badge !== "Agotado"
                ? "Más pedido"
                : (p.badge ?? null),
            extras: (p.extras as Array<{ name: string; price: number }>) ?? [],
            addons: (p.addons as Array<{ name: string; price: number }>) ?? [],
            option_groups: (p.option_groups as ProductOptionGroup[]) ?? [],
            is_featured: p.is_featured ?? false,
            featured_order: p.featured_order ?? 0,
            ingredients: p.ingredients ?? [],
          }));
        if (uncategorized.length > 0) {
          mapped.push({
            id: "uncategorized",
            name: "Otros",
            emoji: "🍽️",
            allow_half: false,
            items: uncategorized,
          });
        }
        return mapped;
      })(),
    },
  };
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  // 1. Supabase (fuente principal)
  try {
    const tenant = await getActiveTenant(slug);
    if (tenant) {
      const [categories, products, topProductId, ratingSummary, deliveryZones] =
        await Promise.all([
          getTenantCategories(tenant.id),
          getTenantProducts(tenant.id),
          getTopProductId(tenant.id),
          getRatingSummary(tenant.id),
          tenant.delivery_mode === "zones"
            ? getTenantDeliveryZones(tenant.id)
            : Promise.resolve([]),
        ]);
      return mapToRestaurant(
        tenant,
        categories,
        products,
        topProductId,
        ratingSummary,
        deliveryZones,
      );
    }
  } catch {}

  // 2. JSON local (fallback para dev)
  try {
    if (!/^[a-z0-9-]+$/.test(slug)) return null;
    const filePath = path.join(
      process.cwd(),
      "data",
      "restaurants",
      `${slug}.json`,
    );
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as Restaurant;
  } catch {
    return null;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  // 1. Supabase
  try {
    const tenants = await getAllTenants();
    if (tenants.length > 0) {
      return tenants.map((t) => mapToRestaurant(t as Tenant, [], []));
    }
  } catch {}

  // 2. JSON local
  try {
    const dir = path.join(process.cwd(), "data", "restaurants");
    const files = await fs.readdir(dir);
    return await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const content = await fs.readFile(path.join(dir, f), "utf-8");
          return JSON.parse(content) as Restaurant;
        }),
    );
  } catch {
    return [];
  }
}
