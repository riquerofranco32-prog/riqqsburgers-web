"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Trash2, Plus, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { DeliveryZone } from "@/types/supabase";
import type { DeliveryPosition } from "@/components/AddressGeocodePicker";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import {
  INLINE_CONFIRM_VARIANTS,
  INLINE_CONFIRM_TRANSITION,
} from "@/components/ui/admin/InlineConfirm";

const AddressGeocodePicker = dynamic(
  () => import("@/components/AddressGeocodePicker"),
  { ssr: false },
);

const DEFAULT_RADIUS_KM = 2;

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

export default function DeliveryZonesEditor({
  slug,
  tenantLat,
  tenantLng,
}: {
  slug: string;
  tenantLat: number | null;
  tenantLng: number | null;
}) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery-zones?slug=${slug}`);
      if (res.ok) setZones(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function addZone() {
    if (!newName.trim() || newPrice === "" || Number(newPrice) < 0) {
      toast.error("Completá nombre y precio");
      return;
    }
    const res = await fetch("/api/delivery-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: newName.trim(),
        price: Number(newPrice),
        sort_order: zones.length,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewPrice("");
      void load();
      toast.success("Zona agregada");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Error al agregar la zona");
    }
  }

  async function updateZone(id: string, patch: Partial<DeliveryZone>) {
    const res = await fetch(`/api/delivery-zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, ...patch } : z)),
      );
    } else {
      toast.error("No se pudo guardar el cambio");
    }
  }

  async function deleteZone(id: string) {
    setConfirmDeleteId(null);
    const res = await fetch(`/api/delivery-zones/${id}`, { method: "DELETE" });
    if (res.ok) {
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast.success("Zona eliminada");
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  if (loading) {
    return (
      <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
        Cargando zonas...
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {zones.map((z) => (
        <div
          key={z.id}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "8px 10px",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              defaultValue={z.name}
              onBlur={(e) =>
                e.target.value.trim() !== z.name &&
                void updateZone(z.id, { name: e.target.value.trim() })
              }
            />
            <input
              type="number"
              min={0}
              style={{ ...inputStyle, width: 100 }}
              defaultValue={z.price}
              onBlur={(e) =>
                Number(e.target.value) !== z.price &&
                void updateZone(z.id, { price: Number(e.target.value) })
              }
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--dash-muted)",
              }}
            >
              <input
                type="checkbox"
                checked={z.active}
                onChange={(e) =>
                  void updateZone(z.id, { active: e.target.checked })
                }
              />
              Activa
            </label>
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === z.id ? null : z.id)}
              aria-label={`Configurar ubicación de ${z.name}`}
              style={{
                background: "none",
                border: "none",
                color: z.lat !== null ? "var(--accent)" : "#d97706",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              <MapPin size={15} />
            </button>
            <AnimatePresence initial={false}>
              {confirmDeleteId !== z.id && (
                <motion.button
                  type="button"
                  onClick={() => setConfirmDeleteId(z.id)}
                  aria-label={`Eliminar zona ${z.name}`}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={INLINE_CONFIRM_VARIANTS}
                  transition={INLINE_CONFIRM_TRANSITION}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                  }}
                >
                  <Trash2 size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {confirmDeleteId === z.id && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={INLINE_CONFIRM_VARIANTS}
                transition={INLINE_CONFIRM_TRANSITION}
                style={{ display: "flex", gap: 6 }}
              >
                <AdminButton
                  variant="danger"
                  onClick={() => void deleteZone(z.id)}
                >
                  Sí, eliminar zona
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancelar
                </AdminButton>
              </motion.div>
            )}
          </AnimatePresence>

          {z.lat === null && (
            <p style={{ fontSize: 11, color: "#d97706", margin: 0 }}>
              ⚠️ Sin ubicación configurada — esta zona no se va a ofrecer a los
              clientes hasta que le marques un centro y radio.
            </p>
          )}

          {expandedId === z.id && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 4,
              }}
            >
              <AddressGeocodePicker
                slug={slug}
                fallbackCenter={
                  z.lat !== null && z.lng !== null
                    ? { lat: z.lat, lng: z.lng }
                    : tenantLat !== null && tenantLng !== null
                      ? { lat: tenantLat, lng: tenantLng }
                      : null
                }
                initialPosition={
                  z.lat !== null && z.lng !== null
                    ? { lat: z.lat, lng: z.lng, label: z.name }
                    : null
                }
                mapHeight={180}
                onChange={(pos: DeliveryPosition) =>
                  void updateZone(z.id, {
                    lat: pos.lat,
                    lng: pos.lng,
                    radius_km: z.radius_km ?? DEFAULT_RADIUS_KM,
                  })
                }
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "var(--dash-muted)",
                }}
              >
                Radio (km)
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  style={{ ...inputStyle, width: 80 }}
                  defaultValue={z.radius_km ?? DEFAULT_RADIUS_KM}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0 && v !== z.radius_km) {
                      void updateZone(z.id, { radius_km: v });
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Nombre de la zona"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="number"
          min={0}
          style={{ ...inputStyle, width: 100 }}
          placeholder="Precio"
          value={newPrice}
          onChange={(e) =>
            setNewPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
        <button
          type="button"
          onClick={() => void addZone()}
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
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}
