import { createServerClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Coupon } from "@/types/supabase";
import { CouponsAdmin } from "@/components/admin/coupons/CouponsAdmin";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cupones" };

export default async function CuponesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const { data: rawCoupons } = await db
    .from("coupons")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const coupons = (rawCoupons ?? []) as Coupon[];

  // Cuánto facturaron los pedidos que usaron cada cupón — `orders.coupon_code`
  // es el vínculo (no hay coupon_id), así que se suma por código en vez de
  // hacer un join relacional.
  let revenueByCode: Record<string, number> = {};
  if (coupons.length > 0) {
    const { data: couponOrders } = await db
      .from("orders")
      .select("coupon_code, total")
      .eq("tenant_id", tenantId)
      .not("coupon_code", "is", null)
      .neq("status", "cancelled");
    revenueByCode = (
      (couponOrders ?? []) as { coupon_code: string | null; total: number }[]
    ).reduce<Record<string, number>>((acc, o) => {
      if (!o.coupon_code) return acc;
      acc[o.coupon_code] = (acc[o.coupon_code] ?? 0) + o.total;
      return acc;
    }, {});
  }

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Cupones
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Códigos de descuento para el checkout de tu catálogo
        </p>
      </div>

      <CouponsAdmin
        slug={slug}
        initialCoupons={coupons}
        revenueByCode={revenueByCode}
      />
    </div>
  );
}
