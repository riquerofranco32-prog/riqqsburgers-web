import fs from "fs/promises";
import path from "path";
import {
  getActiveTenant,
  getAllTenants,
  getTenantProducts,
  getTenantCategories,
} from "./tenants";
import { createServerClient } from "./supabase";
import type { Tenant, Category, Product } from "@/types/supabase";

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
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
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
  accent_color: string;
  primary_color: string;
  delivery_cost: number;
  address: string;
  schedule: string;
  is_open: boolean;
  brand: RestaurantBrand | null;
  menu: {
    categories: MenuCategory[];
  };
}

async function getTopProductId(tenantId: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("items")
    .eq("tenant_id", tenantId)
    .not("items", "is", null);

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

function mapToRestaurant(
  tenant: Tenant,
  categories: Category[],
  products: Product[],
  topProductId?: string | null,
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
    accent_color: tenant.primary_color ?? "#FF6B35",
    primary_color: tenant.primary_color ?? "#FF6B35",
    delivery_cost: tenant.delivery_cost ?? 0,
    address: tenant.address ?? "",
    schedule: tenant.schedule ?? "",
    is_open: tenant.is_open ?? true,
    brand: (tenant.brand as RestaurantBrand | null) ?? null,
    menu: {
      categories: (() => {
        const assignedIds = new Set(categories.map((c) => c.id));
        const mapped = categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          emoji: cat.emoji ?? "🍽️",
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
          }));
        if (uncategorized.length > 0) {
          mapped.push({
            id: "uncategorized",
            name: "Otros",
            emoji: "🍽️",
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
      const [categories, products, topProductId] = await Promise.all([
        getTenantCategories(tenant.id),
        getTenantProducts(tenant.id),
        getTopProductId(tenant.id),
      ]);
      return mapToRestaurant(tenant, categories, products, topProductId);
    }
  } catch {}

  // 2. JSON local (fallback para dev)
  try {
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
