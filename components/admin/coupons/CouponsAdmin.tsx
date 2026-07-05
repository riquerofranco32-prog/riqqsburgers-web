"use client";

import { useState } from "react";
import { Plus, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/types/supabase";
import { AdminModal } from "@/components/ui/admin/AdminModal";
import { AdminField, adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";

interface CouponForm {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  expires_at: string;
}

const emptyForm: CouponForm = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function CouponModal({
  onSave,
  onClose,
}: {
  onSave: (data: CouponForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CouponForm>(key: K, val: CouponForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  }

  async function doSave() {
    if (!form.code.trim()) {
      setError("El código es obligatorio");
      return;
    }
    const value = Number(form.discount_value);
    if (!form.discount_value || isNaN(value) || value <= 0) {
      setError("Ingresá un valor de descuento válido");
      return;
    }
    if (form.discount_type === "percent" && value > 100) {
      setError("El porcentaje no puede superar 100");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <AdminModal
      title="Nuevo cupón"
      onClose={onClose}
      footer={
        <AdminButton onClick={doSave} disabled={saving} fullWidth>
          {saving ? "Guardando..." : "Crear cupón"}
        </AdminButton>
      }
    >
      <AdminField label="Código *" error={error}>
        <input
          value={form.code}
          autoFocus
          onChange={(e) => set("code", e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") doSave();
          }}
          placeholder="Ej: BIENVENIDO10"
          style={{ ...adminInputStyle, textTransform: "uppercase" }}
        />
      </AdminField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Tipo">
          <select
            value={form.discount_type}
            onChange={(e) =>
              set("discount_type", e.target.value as "percent" | "fixed")
            }
            style={adminInputStyle}
          >
            <option value="percent">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </AdminField>
        <AdminField label="Valor *">
          <input
            type="number"
            value={form.discount_value}
            onChange={(e) => set("discount_value", e.target.value)}
            placeholder={form.discount_type === "percent" ? "10" : "1000"}
            min={0}
            style={adminInputStyle}
          />
        </AdminField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Pedido mínimo">
          <input
            type="number"
            value={form.min_order_amount}
            onChange={(e) => set("min_order_amount", e.target.value)}
            placeholder="Opcional"
            min={0}
            style={adminInputStyle}
          />
        </AdminField>
        <AdminField label="Máx. usos">
          <input
            type="number"
            value={form.max_uses}
            onChange={(e) => set("max_uses", e.target.value)}
            placeholder="Ilimitado"
            min={1}
            style={adminInputStyle}
          />
        </AdminField>
      </div>

      <AdminField label="Vence el">
        <input
          type="date"
          value={form.expires_at}
          onChange={(e) => set("expires_at", e.target.value)}
          style={adminInputStyle}
        />
      </AdminField>
    </AdminModal>
  );
}

export function CouponsAdmin({
  slug,
  initialCoupons,
}: {
  slug: string;
  initialCoupons: Coupon[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleSave(form: CouponForm) {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          code: form.code.trim(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: form.min_order_amount
            ? Number(form.min_order_amount)
            : null,
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at
            ? new Date(form.expires_at).toISOString()
            : null,
        }),
      });
      if (res.ok) {
        const data: Coupon = await res.json();
        setCoupons((prev) => [data, ...prev]);
        toast.success("Cupón creado");
        setShowModal(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Error al crear el cupón");
      }
    } catch {
      toast.error("Error al crear el cupón");
    }
  }

  async function toggleActive(coupon: Coupon) {
    const nextActive = !coupon.active;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: nextActive } : c)),
    );
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, active: coupon.active } : c,
        ),
      );
      toast.error("Error al actualizar el cupón");
    }
  }

  async function handleDelete(coupon: Coupon) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success("Cupón eliminado");
    } catch {
      toast.error("Error al eliminar el cupón");
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3">
        <span
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--dash-surface-2)",
            color: "var(--dash-muted)",
            border: "1px solid var(--dash-border)",
            fontWeight: 500,
          }}
        >
          {coupons.length} cupón{coupons.length !== 1 ? "es" : ""}
        </span>
        <AdminButton onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nuevo cupón
        </AdminButton>
      </div>

      {coupons.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "56px 0",
            color: "var(--dash-muted)",
          }}
        >
          <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p style={{ fontSize: 14 }}>Todavía no creaste ningún cupón.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {coupons.map((c) => {
            const isExhausted = c.max_uses !== null && c.uses >= c.max_uses;
            const isExpired = c.expires_at
              ? new Date(c.expires_at) < new Date()
              : false;
            return (
              <div
                key={c.id}
                style={{
                  background: "var(--dash-surface)",
                  border: "1px solid var(--dash-border)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  flexWrap: "wrap",
                  opacity: c.active ? 1 : 0.6,
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "var(--dash-text)",
                        fontSize: 14,
                      }}
                    >
                      {c.code}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(255,107,53,0.1)",
                        color: "var(--accent)",
                        border: "1px solid rgba(255,107,53,0.3)",
                        fontWeight: 600,
                      }}
                    >
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : fmtARS(c.discount_value)}
                    </span>
                    {isExhausted && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--dash-surface-2)",
                          color: "var(--dash-muted)",
                        }}
                      >
                        Agotado
                      </span>
                    )}
                    {isExpired && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                        }}
                      >
                        Vencido
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--dash-muted)",
                      marginTop: 4,
                    }}
                  >
                    {c.uses} uso{c.uses !== 1 ? "s" : ""}
                    {c.max_uses !== null ? ` / ${c.max_uses}` : ""}
                    {c.min_order_amount
                      ? ` · mín. ${fmtARS(c.min_order_amount)}`
                      : ""}
                    {c.expires_at
                      ? ` · vence ${new Date(c.expires_at).toLocaleDateString("es-AR")}`
                      : ""}
                  </p>
                </div>

                <button
                  onClick={() => toggleActive(c)}
                  title={c.active ? "Desactivar" : "Activar"}
                  aria-label={c.active ? "Desactivar cupón" : "Activar cupón"}
                  style={{
                    width: 44,
                    height: 28,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 24,
                      borderRadius: 999,
                      background: c.active
                        ? "var(--accent)"
                        : "var(--dash-border)",
                      position: "relative",
                      transition: "background 0.15s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: c.active ? 18 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.15s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </button>

                {confirmDeleteId === c.id ? (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <AdminButton
                      variant="danger"
                      onClick={() => handleDelete(c)}
                    >
                      Sí, eliminar
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      No
                    </AdminButton>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    aria-label="Eliminar cupón"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "none",
                      border: "none",
                      color: "var(--dash-muted)",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CouponModal onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
