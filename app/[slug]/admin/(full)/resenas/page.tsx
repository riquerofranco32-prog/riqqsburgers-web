import { createServerClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Review } from "@/types/supabase";
import {
  ReviewsAdmin,
  type ReviewWithOrderRef,
} from "@/components/admin/reviews/ReviewsAdmin";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reseñas" };

export default async function ResenasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const { data: rawReviews } = await db
    .from("reviews")
    .select("*, orders(order_ref)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Cada review referencia su pedido de origen (order_id) — se trae
  // order_ref acá para poder linkear directo a /pedidos/[ref] sin una
  // segunda query desde el cliente.
  const reviews: ReviewWithOrderRef[] = (rawReviews ?? []).map((r) => {
    const { orders, ...review } = r as Review & {
      orders: { order_ref: string | null } | null;
    };
    return { ...review, order_ref: orders?.order_ref ?? null };
  });

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Reseñas
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Calificaciones que dejan los clientes después de recibir su pedido
        </p>
      </div>

      <ReviewsAdmin reviews={reviews} slug={slug} />
    </div>
  );
}
