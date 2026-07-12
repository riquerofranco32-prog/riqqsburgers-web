import { createServerClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import EmptyState from "@/components/admin/EmptyState";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actividad" };

const MAX_EVENTS = 100;

const ACTION_LABELS: Record<string, string> = {
  "order.confirmed": "Confirmó el pedido",
  "order.cancelled": "Canceló el pedido",
  "order.status_changed": "Cambió el estado del pedido",
  "order.deleted": "Eliminó el pedido",
  "product.availability_toggled": "Cambió disponibilidad de producto",
  "product.stock_updated": "Actualizó el stock",
  "product.category_changed": "Cambió la categoría del producto",
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function describeEntity(entityType: string, entityId: string | null): string {
  if (!entityId) return entityType;
  return entityType === "order"
    ? `Pedido #${entityId}`
    : `Producto ${entityId}`;
}

interface ActivityRow {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function ActividadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const db = createServerClient();
  const { data } = await db
    .from("activity_log")
    .select(
      "id, actor_email, action, entity_type, entity_id, metadata, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(MAX_EVENTS);

  const events = (data ?? []) as ActivityRow[];

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Actividad
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Últimos {MAX_EVENTS} cambios hechos por vos o tu equipo en el panel
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="Todavía no hay actividad registrada"
          description="Acá vas a ver el historial de cambios que hagas vos o tu equipo en el panel."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/60 text-left text-xs text-zinc-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Quién</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Entidad</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-t border-zinc-800/80 text-zinc-300"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {fmtFecha(ev.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {ev.actor_email}
                  </td>
                  <td className="px-4 py-3">
                    {ACTION_LABELS[ev.action] ?? ev.action}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {describeEntity(ev.entity_type, ev.entity_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
