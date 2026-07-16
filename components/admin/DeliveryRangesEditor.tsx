"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import type { DeliveryRange } from "@/types/supabase";

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

export default function DeliveryRangesEditor({
  slug,
  branchId,
}: {
  slug: string;
  // Ver comentario equivalente en DeliveryZonesEditor.
  branchId?: string;
}) {
  const [ranges, setRanges] = useState<DeliveryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMaxKm, setNewMaxKm] = useState<number | "">("");
  const [newPrice, setNewPrice] = useState<number | "">("");

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ slug });
      if (branchId) qs.set("branch_id", branchId);
      const res = await fetch(`/api/delivery-ranges?${qs}`);
      if (res.ok) setRanges(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, branchId]);

  async function addRange() {
    if (newMaxKm === "" || newPrice === "" || Number(newMaxKm) <= 0) {
      toast.error("Completá distancia y precio");
      return;
    }
    const res = await fetch("/api/delivery-ranges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        max_km: Number(newMaxKm),
        price: Number(newPrice),
        ...(branchId ? { branch_id: branchId } : {}),
      }),
    });
    if (res.ok) {
      setNewMaxKm("");
      setNewPrice("");
      void load();
      toast.success("Rango agregado");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Error al agregar el rango");
    }
  }

  async function updateRange(id: string, patch: Partial<DeliveryRange>) {
    const res = await fetch(`/api/delivery-ranges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      void load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar el cambio");
    }
  }

  async function deleteRange(id: string) {
    const res = await fetch(`/api/delivery-ranges/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRanges((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rango eliminado");
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  if (loading) {
    return (
      <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
        Cargando rangos...
      </p>
    );
  }

  const sorted = [...ranges].sort((a, b) => a.max_km - b.max_km);
  let prevKm = 0;
  const preview = sorted
    .map((r) => {
      const label = `${prevKm}–${r.max_km} km: $${r.price.toLocaleString("es-AR")}`;
      prevKm = r.max_km;
      return label;
    })
    .join(" · ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border)",
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
            Hasta
          </span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            style={{ ...inputStyle, width: 80 }}
            defaultValue={r.max_km}
            onBlur={(e) =>
              Number(e.target.value) !== r.max_km &&
              void updateRange(r.id, { max_km: Number(e.target.value) })
            }
          />
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>km →</span>
          <input
            type="number"
            min={0}
            style={{ ...inputStyle, width: 100 }}
            defaultValue={r.price}
            onBlur={(e) =>
              Number(e.target.value) !== r.price &&
              void updateRange(r.id, { price: Number(e.target.value) })
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
              checked={r.active}
              onChange={(e) =>
                void updateRange(r.id, { active: e.target.checked })
              }
            />
            Activo
          </label>
          <button
            type="button"
            onClick={() => void deleteRange(r.id)}
            aria-label={`Eliminar rango hasta ${r.max_km}km`}
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
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input
          type="number"
          min={0.1}
          step={0.1}
          style={{ ...inputStyle, width: 100 }}
          placeholder="Hasta (km)"
          value={newMaxKm}
          onChange={(e) =>
            setNewMaxKm(e.target.value === "" ? "" : Number(e.target.value))
          }
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
          onClick={() => void addRange()}
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

      {preview && (
        <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 2 }}>
          {preview}
        </p>
      )}
    </div>
  );
}
