import { createServerClient } from "@/lib/supabase";
import type { Coupon } from "@/types/supabase";

export interface CouponValidationResult {
  ok: boolean;
  error?: string;
  coupon?: Coupon;
  discountAmount?: number;
}

export function computeDiscount(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.discount_type === "percent"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;
  return Math.min(Math.max(raw, 0), subtotal);
}

export async function validateCoupon(
  tenantId: string,
  code: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const supabase = createServerClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("tenant_id", tenantId)
    .ilike("code", code.trim())
    .maybeSingle();

  if (!coupon) return { ok: false, error: "Cupón no encontrado" };
  const c = coupon as Coupon;

  if (!c.active) return { ok: false, error: "Cupón inactivo" };
  if (c.starts_at && new Date(c.starts_at) > new Date()) {
    return { ok: false, error: "Cupón todavía no está activo" };
  }
  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return { ok: false, error: "Cupón vencido" };
  }
  if (c.max_uses !== null && c.uses >= c.max_uses) {
    return { ok: false, error: "Cupón sin usos disponibles" };
  }
  if (c.min_order_amount !== null && subtotal < c.min_order_amount) {
    return {
      ok: false,
      error: `Pedido mínimo de $${c.min_order_amount.toLocaleString("es-AR")} para este cupón`,
    };
  }

  return { ok: true, coupon: c, discountAmount: computeDiscount(c, subtotal) };
}

// --- Community: /ofertas page ---

export interface PublicOffer {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  expires_at: string | null;
  business: {
    slug: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
  };
}

export async function getAllPublicOffers(): Promise<PublicOffer[]> {
  const supabase = createServerClient();

  const { data: coupons } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_order_amount, max_uses, uses, starts_at, expires_at, tenant_id",
    )
    .eq("active", true)
    .eq("show_in_menu", true)
    .order("created_at", { ascending: false });

  if (!coupons || coupons.length === 0) return [];

  // Filter out exhausted/expired/not-started-yet
  const validCoupons = coupons.filter(
    (c) =>
      (c.max_uses === null || c.uses < c.max_uses) &&
      (!c.starts_at || new Date(c.starts_at) <= new Date()) &&
      (!c.expires_at || new Date(c.expires_at) > new Date()),
  );

  if (validCoupons.length === 0) return [];

  // Fetch tenant info for each unique tenant
  const tenantIds = Array.from(new Set(validCoupons.map((c) => c.tenant_id)));
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, slug, name, logo_url, primary_color")
    .eq("active", true)
    .in("id", tenantIds);

  const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]));

  return validCoupons
    .filter((c) => tenantMap.has(c.tenant_id))
    .map((c) => {
      const t = tenantMap.get(c.tenant_id)!;
      return {
        id: c.id,
        code: c.code,
        discount_type: c.discount_type as "percent" | "fixed",
        discount_value: c.discount_value,
        min_order_amount: c.min_order_amount,
        expires_at: c.expires_at,
        business: {
          slug: t.slug,
          name: t.name,
          logo_url: t.logo_url,
          primary_color: t.primary_color,
        },
      };
    });
}
