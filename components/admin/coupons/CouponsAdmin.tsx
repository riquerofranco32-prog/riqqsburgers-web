"use client";

import { useState } from "react";
import { Plus, Trash2, Percent } from "lucide-react";
import type { Coupon } from "@/types/supabase";
import { Toast } from "@/components/admin/Toast";

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
  slug,
  onSave,
  onClose,
}: {
  slug: string;
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 w-full max-w-md rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl border border-zinc-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-bold font-[family-name:var(--font-syne)]">
            Nuevo cupón
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Código *
            </label>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="Ej: BIENVENIDO10"
              style={{ fontSize: 16 }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Tipo
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  set("discount_type", e.target.value as "percent" | "fixed")
                }
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
              >
                <option value="percent">Porcentaje</option>
                <option value="fixed">Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Valor *
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)}
                placeholder={form.discount_type === "percent" ? "10" : "1000"}
                min={0}
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Pedido mínimo
              </label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => set("min_order_amount", e.target.value)}
                placeholder="Opcional"
                min={0}
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Máx. usos
              </label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => set("max_uses", e.target.value)}
                placeholder="Ilimitado"
                min={1}
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Vence el
            </label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => set("expires_at", e.target.value)}
              style={{ fontSize: 16 }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={doSave}
            disabled={saving}
            className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear cupón"}
          </button>
        </div>
      </div>
    </div>
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
  const [toast, setToast] = useState<string | null>(null);
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
        setToast("Cupón creado");
        setShowModal(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setToast(data.error ?? "Error al crear el cupón");
      }
    } catch {
      setToast("Error al crear el cupón");
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
      setToast("Error al actualizar el cupón");
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
      setToast("Cupón eliminado");
    } catch {
      setToast("Error al eliminar el cupón");
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
          {coupons.length} cupón{coupons.length !== 1 ? "es" : ""}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-yellow-400 text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Nuevo cupón
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-14 text-zinc-500">
          <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Todavía no creaste ningún cupón.</p>
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
                className={`bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center gap-3 p-4 flex-wrap ${!c.active ? "opacity-60" : ""}`}
              >
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white text-sm">
                      {c.code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-semibold">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : fmtARS(c.discount_value)}
                    </span>
                    {isExhausted && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                        Agotado
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Vencido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
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
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 44, height: 28 }}
                  title={c.active ? "Desactivar" : "Activar"}
                >
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative ${c.active ? "bg-yellow-400" : "bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c.active ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </div>
                </button>

                {confirmDeleteId === c.id ? (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-xs text-white bg-red-600 hover:bg-red-500 min-h-[36px] px-3 rounded-xl transition-all font-semibold"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-zinc-400 hover:text-white min-h-[36px] px-3 rounded-xl hover:bg-zinc-800 transition-all"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="text-zinc-600 hover:text-red-400 w-11 h-11 rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center flex-shrink-0"
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
        <CouponModal
          slug={slug}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
