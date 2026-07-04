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
