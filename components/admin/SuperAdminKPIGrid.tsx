"use client";

import { Store, DollarSign, ShoppingBag, Clock } from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";

interface SuperAdminKPIGridProps {
  activeTenantsCount: number;
  mrr: number;
  totalOrders: number;
  renewingSoonCount: number;
  renewalWindowDays: number;
}

export default function SuperAdminKPIGrid({
  activeTenantsCount,
  mrr,
  totalOrders,
  renewingSoonCount,
  renewalWindowDays,
}: SuperAdminKPIGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}
    >
      <KPICard
        label="Restaurantes activos"
        value={String(activeTenantsCount)}
        icon={Store}
        href="/admin/restaurants"
      />
      <KPICard
        label="MRR estimado"
        value={`$${mrr.toLocaleString("es-AR")}`}
        sub="Planes pagos activos"
        icon={DollarSign}
        href="/admin/subscriptions"
      />
      <KPICard
        label="Pedidos totales"
        value={String(totalOrders)}
        sub="Histórico, todos los negocios"
        icon={ShoppingBag}
      />
      <KPICard
        label={`Vencen en ${renewalWindowDays} días`}
        value={String(renewingSoonCount)}
        icon={Clock}
        href="/admin/subscriptions"
      />
    </div>
  );
}
