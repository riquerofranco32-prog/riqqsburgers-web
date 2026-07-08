import { createServerClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/authz";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Order } from "@/types/supabase";
import { OrdersTable } from "@/components/admin/OrdersTable";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const [{ data: rawOrders }, user] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
    getSessionUser(),
  ]);

  const orders = (rawOrders ?? []) as Order[];

  const { data: membership } = user
    ? await db
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .maybeSingle()
    : { data: null };
  const canDelete = membership?.role !== "staff";

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Pedidos
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Gestión y control de pedidos en tiempo real
        </p>
      </div>

      <OrdersTable
        initialOrders={orders}
        slug={slug}
        tenantId={tenantId}
        canDelete={canDelete}
      />
    </div>
  );
}
