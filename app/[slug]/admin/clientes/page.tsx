import { createServerClient } from "@/lib/supabase";
import type { Metadata } from "next";
import type { Tenant } from "@/types/supabase";
import { aggregateCustomers, type CustomerOrderRow } from "@/lib/customers";
import { CustomersTable } from "@/components/admin/customers/CustomersTable";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const { data: rawTenant } = await db
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Pick<Tenant, "id"> | null;
  if (!tenant) return null;

  const { data: rawOrders } = await db
    .from("orders")
    .select("customer_name, customer_phone, total, status, created_at")
    .eq("tenant_id", tenant.id);

  const customers = aggregateCustomers((rawOrders ?? []) as CustomerOrderRow[]);

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Clientes
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Historial de clientes armado a partir de los pedidos
        </p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
