"use client";

import { useMemo, useState } from "react";
import { Search, X, History, SearchX } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";

export interface ActivityRow {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

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

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function ActivityTable({
  events,
  nameByEmail = new Map(),
}: {
  events: ActivityRow[];
  /** Nombre visible por email, para no mostrar el email crudo cuando el
   * miembro ya configuró un nombre en "Mi cuenta". */
  nameByEmail?: Map<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  function actorLabel(email: string): string {
    return nameByEmail.get(email) || email;
  }

  // Solo ofrece filtrar por acciones que realmente aparecen en los datos —
  // no tiene sentido mostrar opciones vacías.
  const availableActions = useMemo(() => {
    const seen = new Set(events.map((e) => e.action));
    return Array.from(seen).sort((a, b) =>
      actionLabel(a).localeCompare(actionLabel(b)),
    );
  }, [events]);

  const filtered = useMemo(() => {
    let list = events;
    if (actionFilter !== "all") {
      list = list.filter((e) => e.action === actionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.actor_email?.toLowerCase().includes(q) ||
          actorLabel(e.actor_email).toLowerCase().includes(q) ||
          e.entity_id?.toLowerCase().includes(q) ||
          actionLabel(e.action).toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, search, actionFilter]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Todavía no hay actividad registrada"
        description="Acá vas a ver el historial de cambios que hagas vos o tu equipo en el panel."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div style={{ position: "relative", minWidth: 220, flex: 1 }}>
          <Search
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--dash-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por quién, acción o entidad..."
            style={{
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 8,
              paddingLeft: 30,
              paddingRight: search ? 30 : 10,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 16, // evita zoom en iOS
              color: "var(--dash-text)",
              outline: "none",
              width: "100%",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--dash-muted)",
                display: "flex",
                padding: 0,
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 13,
            color: "var(--dash-text)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">Todas las acciones</option>
          {availableActions.map((action) => (
            <option key={action} value={action}>
              {actionLabel(action)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description={
            search
              ? `No encontramos actividad para "${search}".`
              : "No hay actividad para este filtro."
          }
          action={{
            label: "Limpiar filtros",
            onClick: () => {
              setSearch("");
              setActionFilter("all");
            },
          }}
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
              {filtered.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-t border-zinc-800/80 text-zinc-300"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {fmtFecha(ev.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {actorLabel(ev.actor_email)}
                  </td>
                  <td className="px-4 py-3">{actionLabel(ev.action)}</td>
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
