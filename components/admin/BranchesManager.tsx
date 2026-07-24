"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Trash2, Plus, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { Branch } from "@/types/supabase";
import type { DeliveryPosition } from "@/components/AddressGeocodePicker";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";
import DeliveryZonesEditor from "@/components/admin/DeliveryZonesEditor";
import DeliveryRangesEditor from "@/components/admin/DeliveryRangesEditor";

const AddressGeocodePicker = dynamic(
  () => import("@/components/AddressGeocodePicker"),
  { ssr: false },
);

const DELIVERY_MODE_OPTIONS = [
  { value: "none" as const, label: "Solo retiro" },
  { value: "fixed" as const, label: "Costo fijo" },
  { value: "zones" as const, label: "Zonas" },
  { value: "distance" as const, label: "Por distancia" },
];

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--dash-surface-2)",
  border: "1.5px solid var(--dash-border)",
  color: "var(--dash-text)",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

export default function BranchesManager({ slug }: { slug: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/branches?slug=${slug}`);
      if (res.ok) setBranches(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function addBranch() {
    if (!newName.trim()) {
      toast.error("Ponele un nombre a la sucursal");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        void load();
        toast.success("Sucursal creada");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al crear la sucursal");
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateBranch(id: string, patch: Partial<Branch>) {
    const res = await fetch(`/api/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setBranches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      );
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar el cambio");
    }
  }

  async function deleteBranch(id: string) {
    setConfirmDeleteId(null);
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("Sucursal eliminada");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo eliminar");
    }
  }

  if (loading) {
    return (
      <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
        Cargando sucursales...
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {branches.map((b) => {
        const isExpanded = expandedId === b.id;
        return (
          <div
            key={b.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 14,
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
                defaultValue={b.name}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value.trim() !== b.name &&
                  void updateBranch(b.id, { name: e.target.value.trim() })
                }
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--dash-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={b.active}
                  onChange={(e) =>
                    void updateBranch(b.id, { active: e.target.checked })
                  }
                />
                Activa
              </label>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
                aria-label={
                  isExpanded ? "Contraer sucursal" : "Configurar sucursal"
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--dash-muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              {branches.length > 1 && (
                <InlineConfirm
                  active={confirmDeleteId === b.id}
                  itemKey={b.id}
                  trigger={
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(b.id)}
                      aria-label={`Eliminar sucursal ${b.name}`}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--dash-danger)",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  }
                  confirm={
                    <div style={{ display: "flex", gap: 6 }}>
                      <AdminButton
                        variant="danger"
                        onClick={() => void deleteBranch(b.id)}
                      >
                        Sí, eliminar sucursal
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancelar
                      </AdminButton>
                    </div>
                  }
                />
              )}
            </div>

            {b.latitude === null && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--dash-warning)",
                  margin: 0,
                }}
              >
                ⚠️ Sin ubicación configurada — no se puede calcular envío por
                distancia ni asignar pedidos por cercanía hasta que la cargues.
              </p>
            )}

            {isExpanded && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--dash-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <MapPin size={12} /> Ubicación de la sucursal
                  </label>
                  <AddressGeocodePicker
                    slug={slug}
                    fallbackCenter={
                      b.latitude !== null && b.longitude !== null
                        ? { lat: b.latitude, lng: b.longitude }
                        : null
                    }
                    initialPosition={
                      b.latitude !== null && b.longitude !== null
                        ? { lat: b.latitude, lng: b.longitude, label: b.name }
                        : null
                    }
                    mapHeight={180}
                    onChange={(pos: DeliveryPosition) =>
                      void updateBranch(b.id, {
                        latitude: pos.lat,
                        longitude: pos.lng,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--dash-muted)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Modo de envío
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {DELIVERY_MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          void updateBranch(b.id, { delivery_mode: opt.value })
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1.5px solid ${
                            b.delivery_mode === opt.value
                              ? "var(--accent)"
                              : "var(--dash-border)"
                          }`,
                          background:
                            b.delivery_mode === opt.value
                              ? "var(--dash-accent-subtle)"
                              : "var(--dash-surface)",
                          color:
                            b.delivery_mode === opt.value
                              ? "var(--accent)"
                              : "var(--dash-text)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {b.delivery_mode === "zones" && (
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        color: "var(--dash-muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Zonas de envío
                    </label>
                    <DeliveryZonesEditor
                      slug={slug}
                      tenantLat={b.latitude}
                      tenantLng={b.longitude}
                      branchId={b.id}
                    />
                  </div>
                )}

                {b.delivery_mode === "distance" && (
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        color: "var(--dash-muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Rangos por distancia
                    </label>
                    <DeliveryRangesEditor slug={slug} branchId={b.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Nombre de la nueva sucursal"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          disabled={creating}
          onClick={() => void addBranch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: creating ? "default" : "pointer",
            opacity: creating ? 0.6 : 1,
          }}
        >
          <Plus size={14} /> Agregar sucursal
        </button>
      </div>
    </div>
  );
}
