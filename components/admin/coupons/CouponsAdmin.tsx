"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Percent,
  Eye,
  EyeOff,
  Search,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/types/supabase";
import EmptyState from "@/components/admin/EmptyState";
import { AdminModal } from "@/components/ui/admin/AdminModal";
import { AdminField, adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";

interface CouponForm {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  starts_at: string;
  expires_at: string;
  show_in_menu: boolean;
}

const emptyForm: CouponForm = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  starts_at: "",
  expires_at: "",
  show_in_menu: true,
};

function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function CouponModal({
  onSave,
  onClose,
  existingCodes,
}: {
  onSave: (data: CouponForm) => Promise<void>;
  onClose: () => void;
  existingCodes: string[];
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
    if (existingCodes.includes(form.code.trim().toUpperCase())) {
      setError("Ya existe un cupón con ese código");
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
    if (
      form.starts_at &&
      form.expires_at &&
      new Date(form.starts_at) >= new Date(form.expires_at)
    ) {
      setError("La fecha de inicio debe ser anterior a la de vencimiento");
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AdminField label="Empieza el">
          <input
            type="date"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            style={adminInputStyle}
          />
        </AdminField>
        <AdminField label="Vence el">
          <input
            type="date"
            value={form.expires_at}
            onChange={(e) => set("expires_at", e.target.value)}
            style={adminInputStyle}
          />
        </AdminField>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          fontSize: 14,
          color: "var(--dash-text)",
        }}
      >
        <input
          type="checkbox"
          checked={form.show_in_menu}
          onChange={(e) => set("show_in_menu", e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
        />
        <span>
          Mostrar en el menú público
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--dash-muted)",
            }}
          >
            Los clientes van a ver el código como banner en tu menú
          </span>
        </span>
      </label>
    </AdminModal>
  );
}

export function CouponsAdmin({
  slug,
  initialCoupons,
  revenueByCode = {},
}: {
  slug: string;
  initialCoupons: Coupon[];
  /** Facturación de pedidos (no cancelados) que usaron cada código de cupón */
  revenueByCode?: Record<string, number>;
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.trim().toLowerCase()),
  );

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
          show_in_menu: form.show_in_menu,
          starts_at: form.starts_at
            ? new Date(form.starts_at).toISOString()
            : null,
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

  async function toggleShowInMenu(coupon: Coupon) {
    const next = !coupon.show_in_menu;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, show_in_menu: next } : c)),
    );
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_in_menu: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Visible en el menú" : "Oculto del menú");
    } catch {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, show_in_menu: coupon.show_in_menu } : c,
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        {coupons.length > 0 && (
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
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
              placeholder="Buscar por código..."
              style={{ ...adminInputStyle, paddingLeft: 30 }}
            />
          </div>
        )}
        <AdminButton onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nuevo cupón
        </AdminButton>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Todavía no creaste ningún cupón"
          description="Los cupones te ayudan a atraer clientes nuevos o premiar a los frecuentes."
          action={{ label: "Crear cupón", onClick: () => setShowModal(true) }}
          variant="dashed"
        />
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description={`No encontramos cupones para "${search}".`}
          action={{ label: "Limpiar búsqueda", onClick: () => setSearch("") }}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredCoupons.map((c) => {
            const isExhausted = c.max_uses !== null && c.uses >= c.max_uses;
            const isExpired = c.expires_at
              ? new Date(c.expires_at) < new Date()
              : false;
            const isNotStarted = c.starts_at
              ? new Date(c.starts_at) > new Date()
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
                  opacity: c.active && !isExpired && !isNotStarted ? 1 : 0.6,
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
                        background: "var(--dash-accent-subtle)",
                        color: "var(--accent)",
                        border: "1px solid var(--dash-accent-glow)",
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
                          background: "var(--dash-danger-bg)",
                          color: "var(--dash-danger)",
                        }}
                      >
                        Vencido
                      </span>
                    )}
                    {!isExpired && isNotStarted && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--dash-info-bg)",
                          color: "var(--dash-info)",
                        }}
                      >
                        Programado
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
                    {revenueByCode[c.code]
                      ? ` · facturó ${fmtARS(revenueByCode[c.code])}`
                      : ""}
                    {c.min_order_amount
                      ? ` · mín. ${fmtARS(c.min_order_amount)}`
                      : ""}
                    {c.starts_at
                      ? ` · empieza ${new Date(c.starts_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`
                      : ""}
                    {c.expires_at
                      ? ` · vence ${new Date(c.expires_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`
                      : ""}
                  </p>
                </div>

                <button
                  onClick={() => toggleShowInMenu(c)}
                  title={
                    c.show_in_menu
                      ? "Visible en el menú público — tocá para ocultar"
                      : "Oculto del menú público — tocá para mostrar"
                  }
                  aria-label={
                    c.show_in_menu
                      ? "Ocultar del menú público"
                      : "Mostrar en el menú público"
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.show_in_menu
                      ? "var(--accent)"
                      : "var(--dash-muted)",
                  }}
                >
                  {c.show_in_menu ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

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
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  </div>
                </button>

                <InlineConfirm
                  active={confirmDeleteId === c.id}
                  itemKey={c.id}
                  confirm={
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
                  }
                  trigger={
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
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CouponModal
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          existingCodes={coupons.map((c) => c.code.toUpperCase())}
        />
      )}
    </div>
  );
}
