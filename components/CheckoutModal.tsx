"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { trackGA4Event } from "@/lib/analytics";
import { estimateMinutes } from "@/lib/eta";

export interface CheckoutCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedExtra?: { name: string; price: number };
  selectedAddons?: Array<{ name: string; price: number }>;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CheckoutCartItem[];
  onClearCart: () => void;
  orderNotes?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    whatsapp_number: string;
    delivery_cost?: number;
    primary_color?: string;
    min_order_amount?: number | null;
    prep_time_minutes?: number | null;
  };
}

type DeliveryType = "pickup" | "delivery";
type PaymentMethod = "cash" | "transfer";

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onClearCart,
  orderNotes,
  tenant,
}: CheckoutModalProps) {
  const accent = tenant.primary_color || "#FF6B35";

  // Calcular contraste para texto sobre el accent del tenant
  function hexToLuma(hex: string): number {
    const c = hex.replace("#", "").padEnd(6, "0");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const onAccent = hexToLuma(accent) < 140 ? "#fff" : "#111";

  const subtotal = cart.reduce(
    (s, i) =>
      s +
      (i.price +
        (i.selectedExtra?.price ?? 0) +
        (i.selectedAddons?.reduce((sum, a) => sum + a.price, 0) ?? 0)) *
        i.quantity,
    0,
  );

  const [loading, setLoading] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    address: "",
    notes: "",
    delivery: "pickup" as DeliveryType,
    payment: "cash" as PaymentMethod,
  });

  const deliveryCost =
    form.delivery === "delivery" ? (tenant.delivery_cost ?? 0) : 0;

  const etaMinutes = estimateMinutes(
    tenant.prep_time_minutes ?? null,
    form.delivery,
  );

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = subtotal + deliveryCost - discountAmount;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          code: couponInput.trim(),
          subtotal,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        discount_amount?: number;
      };
      if (!res.ok || data.discount_amount === undefined) {
        setCouponError(data.error ?? "Cupón inválido");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: couponInput.trim().toUpperCase(),
        discountAmount: data.discount_amount,
      });
    } catch {
      setCouponError("No se pudo validar el cupón");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  const minOrderAmount = tenant.min_order_amount ?? null;
  const belowMinOrder =
    minOrderAmount !== null &&
    form.delivery === "delivery" &&
    subtotal < minOrderAmount;

  useEffect(() => {
    if (!isOpen) {
      setDone(false);
      setError("");
      setOrderRef("");
      setLoading(false);
      setTouched({});
      setCouponInput("");
      setAppliedCoupon(null);
      setCouponError("");
      setForm({
        name: "",
        lastname: "",
        phone: "",
        address: "",
        notes: "",
        delivery: "pickup",
        payment: "cash",
      });
    } else {
      // Autofill con datos guardados de sesiones anteriores
      try {
        const saved = JSON.parse(
          localStorage.getItem("tak_customer") ?? "{}",
        ) as Partial<typeof form>;
        if (saved.name || saved.lastname || saved.phone) {
          setForm((prev) => ({
            ...prev,
            name: saved.name ?? prev.name,
            lastname: saved.lastname ?? prev.lastname,
            phone: saved.phone ?? prev.phone,
            delivery: saved.delivery ?? prev.delivery,
            payment: saved.payment ?? prev.payment,
          }));
        }
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus trap + restore focus on close (body scroll lock already handled by the parent)
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;

    function getFocusable(): HTMLElement[] {
      return Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    }

    getFocusable()[0]?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleTab);

    return () => {
      window.removeEventListener("keydown", handleTab);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const nameError = touched.name && !form.name ? "Obligatorio" : "";
  const lastnameError = touched.lastname && !form.lastname ? "Obligatorio" : "";
  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneError = !touched.phone
    ? ""
    : !form.phone
      ? "Obligatorio"
      : phoneDigits.length < 8 || phoneDigits.length > 15
        ? "Ingresá un teléfono válido"
        : "";
  const addressError =
    touched.address && form.delivery === "delivery" && !form.address
      ? "Ingresá la dirección"
      : "";

  async function handleConfirm() {
    setTouched({ name: true, lastname: true, phone: true, address: true });
    if (!form.name || !form.lastname) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    if (!form.phone || phoneDigits.length < 8 || phoneDigits.length > 15) {
      setError("Ingresá un teléfono válido");
      return;
    }
    if (form.delivery === "delivery" && !form.address) {
      setError("Ingresá la dirección de entrega");
      return;
    }
    if (belowMinOrder) {
      setError(
        `El monto mínimo para delivery es $${minOrderAmount!.toLocaleString("es-AR")}`,
      );
      return;
    }

    setLoading(true);
    setError("");

    // Ref temporal para el mensaje de WhatsApp — será reemplazado por el
    // que devuelva el servidor. Se usa aquí solo para que el mensaje sea
    // coherente si el usuario lo envía antes de que llegue el response.
    const tempRef = generateRef();

    // Build WhatsApp message BEFORE any async operation so window.open
    // is called synchronously from the click handler — browsers block
    // popups opened after an await.
    const now = new Date();
    const fecha = now.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const hora = now.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fmt = (n: number) =>
      "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });
    const serviceLabel =
      form.delivery === "delivery" ? "Delivery" : "Retiro en local";
    const paymentLabel = form.payment === "cash" ? "Efectivo" : "Transferencia";

    // prettier-ignore
    // String.fromCodePoint: runtime generation from ASCII hex — formatter-proof
    const E = {
      wave:     String.fromCodePoint(0x1F44B), // 👋
      calendar: String.fromCodePoint(0x1F5D3), // 🗓
      clock:    String.fromCodePoint(0x23F0),  // ⏰
      memo:     String.fromCodePoint(0x1F4DD), // 📝
      dollar:   String.fromCodePoint(0x1F4B2), // 💲
      point:    String.fromCodePoint(0x1F446), // 👆
    };

    const catalogUrl = `${window.location.origin}/${tenant.slug}`;

    const lines = [
      `${E.wave} Vengo de ${catalogUrl}`,
      tempRef,
      `${E.calendar} ${fecha} ${E.clock} ${hora}`,
      ``,
      `Tipo de servicio: ${serviceLabel}`,
      ``,
      `Nombre: ${form.name} ${form.lastname}`,
      form.phone ? `Teléfono: ${form.phone}` : null,
      form.delivery === "delivery" && form.address
        ? `Dirección: ${form.address}`
        : null,
      form.notes ? `Notas: ${form.notes}` : null,
      ``,
      `${E.memo} Productos`,
      ...cart.flatMap((i) => {
        const addonsSum =
          i.selectedAddons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
        const total =
          (i.price + (i.selectedExtra?.price ?? 0) + addonsSum) * i.quantity;
        const addonsLabel =
          i.selectedAddons && i.selectedAddons.length > 0
            ? ` + ${i.selectedAddons.map((a) => a.name).join(", ")}`
            : "";
        return [
          `X${i.quantity} ${i.name.toUpperCase()}${i.selectedExtra ? ` (${i.selectedExtra.name})` : ""}${addonsLabel}  ${fmt(total)}`,
          ...(i.notes ? [`   → ${i.notes}`] : []),
        ];
      }),
      ``,
      orderNotes ? `Aclaraciones del pedido: ${orderNotes}` : null,
      orderNotes ? `` : null,
      `Subtotal: ${fmt(subtotal)}`,
      deliveryCost > 0 ? `Entrega: ${fmt(deliveryCost)}` : null,
      appliedCoupon
        ? `Descuento (${appliedCoupon.code}): -${fmt(discountAmount)}`
        : null,
      `Total: ${fmt(grandTotal)}`,
      ``,
      `${E.dollar} Pago`,
      `Estado del pago: No pagado`,
      `Total a pagar: ${fmt(grandTotal)}`,
      paymentLabel,
      ``,
      `${E.point} Envíanos este mensaje. En cuanto lo recibamos estaremos atendiéndote.`,
      ``,
      `Seguí tu pedido en vivo: ${window.location.origin}/pedido/${tempRef}`,
    ]
      .filter(Boolean)
      .join("\n");

    const phone = tenant.whatsapp_number.replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`,
      "_blank",
    );

    // Guardar la orden server-side — los precios se calculan en el servidor
    // con los valores reales de la DB, no los del estado del cliente.
    let finalRef = tempRef;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          items: cart.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            selected_extra: i.selectedExtra
              ? { name: i.selectedExtra.name }
              : null,
            addons: (i.selectedAddons ?? []).map((a) => ({ name: a.name })),
          })),
          delivery_type: form.delivery,
          payment_method: form.payment,
          customer_name: `${form.name} ${form.lastname}`.trim(),
          customer_phone: form.phone || null,
          customer_address: form.delivery === "delivery" ? form.address : null,
          notes: form.notes || null,
          coupon_code: appliedCoupon?.code || null,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { order_ref: string; total: number };
        finalRef = data.order_ref;
        setOrderRef(data.order_ref);
      } else {
        setOrderRef(tempRef);
      }
    } catch {
      setOrderRef(tempRef);
    }

    trackGA4Event("purchase", {
      transaction_id: tempRef,
      value: grandTotal,
      items: cart.length,
    });
    setDone(true);
    onClearCart();
    setLoading(false);

    // Guardar datos del cliente para autofill futuro
    try {
      localStorage.setItem(
        "tak_customer",
        JSON.stringify({
          name: form.name,
          lastname: form.lastname,
          phone: form.phone,
          delivery: form.delivery,
          payment: form.payment,
        }),
      );
    } catch {}

    // Guardar en historial de pedidos por restaurante
    try {
      const histKey = `tak_history_${tenant.slug}`;
      const history = JSON.parse(
        localStorage.getItem(histKey) ?? "[]",
      ) as Array<{
        ref: string;
        total: number;
        date: string;
        items?: Array<{
          id: string;
          quantity: number;
          selectedExtra?: { name: string; price: number };
          selectedAddons?: Array<{ name: string; price: number }>;
        }>;
      }>;
      history.unshift({
        ref: tempRef,
        total: grandTotal,
        date: new Date().toISOString(),
        items: cart.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          selectedExtra: i.selectedExtra,
          selectedAddons: i.selectedAddons,
        })),
      });
      localStorage.setItem(histKey, JSON.stringify(history.slice(0, 10)));
    } catch {}

    // Guardar último pedido para el pill de seguimiento en el catálogo
    try {
      localStorage.setItem(
        "tak_last_order",
        JSON.stringify({
          ref: finalRef,
          tenantSlug: tenant.slug,
          createdAt: Date.now(),
        }),
      );
    } catch {}
  }

  if (!isOpen) return null;

  const inputBase: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "var(--text-primary)",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  };

  const labelBase: React.CSSProperties = {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media (min-width: 640px) {
          .checkout-sheet {
            border-radius: 20px !important;
            margin-bottom: 24px;
            max-height: 88vh !important;
          }
        }
      `}</style>
      <div
        ref={dialogRef}
        className="checkout-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={done ? "Pedido enviado" : "Completá tu pedido"}
        style={{
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 500,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "0 0 env(safe-area-inset-bottom, 0)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              margin: "0 auto",
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 16,
              top: 14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
              WebkitTapHighlightColor: "transparent",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--border)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {done ? (
          /* ── Success screen ───────────────────────────────────────────── */
          <div
            style={{
              textAlign: "center",
              padding: "32px 24px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <style>{`
              @keyframes confettiFall {
                0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
                100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
              }
            `}</style>
            {[
              {
                left: "10%",
                color: "#FF6B35",
                delay: "0ms",
                size: 8,
                shape: "circle",
              },
              {
                left: "25%",
                color: "#25D366",
                delay: "80ms",
                size: 6,
                shape: "square",
              },
              {
                left: "40%",
                color: "#FF6B35",
                delay: "160ms",
                size: 10,
                shape: "square",
              },
              {
                left: "55%",
                color: "#60a5fa",
                delay: "40ms",
                size: 7,
                shape: "circle",
              },
              {
                left: "70%",
                color: "#25D366",
                delay: "120ms",
                size: 9,
                shape: "square",
              },
              {
                left: "85%",
                color: "#FF6B35",
                delay: "200ms",
                size: 6,
                shape: "circle",
              },
              {
                left: "18%",
                color: "#fbbf24",
                delay: "250ms",
                size: 8,
                shape: "square",
              },
              {
                left: "62%",
                color: "#fbbf24",
                delay: "300ms",
                size: 7,
                shape: "circle",
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 0,
                  left: c.left,
                  width: c.size,
                  height: c.size,
                  borderRadius: c.shape === "circle" ? "50%" : 2,
                  background: c.color,
                  animation: `confettiFall 1.4s ease-in ${c.delay} both`,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            ))}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(37,211,102,0.12)",
                border: "2px solid rgba(37,211,102,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                animation: "pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <CheckCircle2 size={36} color="#25D366" strokeWidth={2} />
            </div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              ¡Casi listo!
            </h2>
            <div
              style={{
                background: "rgba(37,211,102,0.12)",
                border: "1.5px solid rgba(37,211,102,0.4)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                textAlign: "left",
              }}
            >
              <MessageCircle
                size={20}
                strokeWidth={2}
                style={{ color: "#25D366", flexShrink: 0, marginTop: 2 }}
              />
              <p
                style={{
                  color: "var(--text-primary)",
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                Abrí WhatsApp y enviá el mensaje para completar tu pedido.
              </p>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Guardá el código para hacer el seguimiento.
            </p>
            {orderRef && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                  marginTop: -16,
                }}
              >
                Seguí tu pedido en{" "}
                <a
                  href={`/pedido/${orderRef}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: accent, textDecoration: "underline" }}
                >
                  takefyy.com/pedido/{orderRef}
                </a>
              </p>
            )}
            <div
              style={{
                background: "var(--surface-2)",
                border: `2px solid ${accent}`,
                borderRadius: 16,
                padding: "20px 32px",
                display: "inline-block",
                marginBottom: 28,
              }}
            >
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Número de pedido
              </p>
              <span
                style={{
                  color: accent,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontFamily: "monospace",
                }}
              >
                {orderRef}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "0 4px",
              }}
            >
              {orderRef && (
                <a
                  href={`/pedido/${orderRef}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: accent,
                    color: onAccent,
                    borderRadius: 12,
                    padding: "14px 32px",
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: "none",
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  Seguí tu pedido en vivo →
                </a>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 32px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Cerrar
              </button>
              {tenant.whatsapp_number && (
                <a
                  href={`https://wa.me/${tenant.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola! Hice un pedido (#${orderRef}) y queria consultar el estado.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#25D366",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 32px",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <MessageCircle size={16} strokeWidth={2.5} />
                  Consultar por WhatsApp
                </a>
              )}
              <a
                href={`/${tenant.slug}`}
                style={{
                  display: "block",
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 32px",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Seguir pidiendo
              </a>
            </div>
          </div>
        ) : (
          /* ── Form ────────────────────────────────────────────────────── */
          <div style={{ padding: "20px 20px 48px" }}>
            <h2
              style={{
                color: "var(--text-primary)",
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Completá tu pedido
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              {tenant.name}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Resumen */}
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: 12,
                  padding: "16px",
                  border: "1px solid var(--border)",
                }}
              >
                {cart.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      {i.name}
                      {i.selectedExtra ? ` (${i.selectedExtra.name})` : ""}
                      {i.selectedAddons && i.selectedAddons.length > 0
                        ? ` + ${i.selectedAddons.map((a) => a.name).join(", ")}`
                        : ""}{" "}
                      ×{i.quantity}
                    </span>
                    <span>
                      $
                      {(
                        (i.price +
                          (i.selectedExtra?.price ?? 0) +
                          (i.selectedAddons?.reduce(
                            (sum, a) => sum + a.price,
                            0,
                          ) ?? 0)) *
                        i.quantity
                      ).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                {deliveryCost > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span>Envío</span>
                    <span>${deliveryCost.toLocaleString("es-AR")}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#22c55e",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span>Descuento ({appliedCoupon.code})</span>
                    <span>-${discountAmount.toLocaleString("es-AR")}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-primary)",
                    fontWeight: 800,
                    fontSize: 17,
                    borderTop: "1px solid var(--border)",
                    paddingTop: 10,
                    marginTop: 8,
                  }}
                >
                  <span>Total</span>
                  <span
                    style={{
                      color:
                        onAccent === "#fff" ? accent : "var(--text-primary)",
                      background: `${accent}18`,
                      padding: "2px 10px",
                      borderRadius: 8,
                    }}
                  >
                    ${grandTotal.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Cupón de descuento */}
              <div>
                {appliedCoupon ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>
                      ✓ Cupón {appliedCoupon.code} aplicado
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...inputBase, flex: 1 }}
                      placeholder="Código de descuento"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void applyCoupon();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                      style={{
                        padding: "0 16px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        opacity: couponLoading || !couponInput.trim() ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {couponLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>
                    {couponError}
                  </p>
                )}
              </div>

              {/* Nombre y apellido */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label style={labelBase}>Nombre *</label>
                  <input
                    style={{
                      ...inputBase,
                      borderColor: nameError ? "#ef4444" : "var(--border)",
                    }}
                    placeholder="Juan"
                    inputMode="text"
                    autoComplete="given-name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onBlur={() => touch("name")}
                    onFocus={(e) => (e.target.style.borderColor = accent)}
                  />
                  {nameError && <span style={errorStyle}>{nameError}</span>}
                </div>
                <div>
                  <label style={labelBase}>Apellido *</label>
                  <input
                    style={{
                      ...inputBase,
                      borderColor: lastnameError ? "#ef4444" : "var(--border)",
                    }}
                    placeholder="García"
                    inputMode="text"
                    autoComplete="family-name"
                    value={form.lastname}
                    onChange={(e) => set("lastname", e.target.value)}
                    onBlur={() => touch("lastname")}
                    onFocus={(e) => (e.target.style.borderColor = accent)}
                  />
                  {lastnameError && (
                    <span style={errorStyle}>{lastnameError}</span>
                  )}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label style={labelBase}>Teléfono *</label>
                <input
                  style={{
                    ...inputBase,
                    borderColor: phoneError ? "#ef4444" : "var(--border)",
                  }}
                  placeholder="11 1234-5678"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  onFocus={(e) => (e.target.style.borderColor = accent)}
                />
                {phoneError && <span style={errorStyle}>{phoneError}</span>}
              </div>

              {/* Delivery / Pickup */}
              <div>
                <label style={labelBase}>¿Cómo lo recibís? *</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      value: "pickup" as DeliveryType,
                      label: "Retiro en local",
                      sub: "Gratis",
                    },
                    {
                      value: "delivery" as DeliveryType,
                      label: "Delivery",
                      sub:
                        (tenant.delivery_cost ?? 0) > 0
                          ? `+$${(tenant.delivery_cost ?? 0).toLocaleString("es-AR")}`
                          : "Consultar",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("delivery", opt.value)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `2px solid ${form.delivery === opt.value ? accent : "var(--border)"}`,
                        background:
                          form.delivery === opt.value
                            ? accent
                            : "var(--surface-2)",
                        color:
                          form.delivery === opt.value
                            ? onAccent
                            : "var(--text-secondary)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>
                        {opt.sub}
                      </div>
                    </button>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 8,
                  }}
                >
                  ⏱️ Estimado: ~{etaMinutes} min
                </p>
              </div>

              {/* Dirección — solo si delivery */}
              {form.delivery === "delivery" && (
                <div>
                  <label style={labelBase}>Dirección de entrega *</label>
                  <input
                    style={{
                      ...inputBase,
                      borderColor: addressError ? "#ef4444" : "var(--border)",
                    }}
                    placeholder="Av. Corrientes 1234, CABA"
                    inputMode="text"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    onBlur={() => touch("address")}
                    onFocus={(e) => (e.target.style.borderColor = accent)}
                  />
                  {addressError && (
                    <span style={errorStyle}>{addressError}</span>
                  )}
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label style={labelBase}>Método de pago *</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {[
                    { value: "cash" as PaymentMethod, label: "Efectivo" },
                    {
                      value: "transfer" as PaymentMethod,
                      label: "Transferencia",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("payment", opt.value)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `2px solid ${form.payment === opt.value ? accent : "var(--border)"}`,
                        background:
                          form.payment === opt.value
                            ? accent
                            : "var(--surface-2)",
                        color:
                          form.payment === opt.value
                            ? onAccent
                            : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.15s",
                        textAlign: "center",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={labelBase}>Notas / aclaraciones</label>
                <textarea
                  style={{ ...inputBase, resize: "none", minHeight: 72 }}
                  placeholder="Sin cebolla, extra salsa..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = accent)}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "#ef4444",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              {belowMinOrder && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#d97706",
                    background: "rgba(217,119,6,0.1)",
                    border: "1px solid rgba(217,119,6,0.3)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    margin: 0,
                  }}
                >
                  Mínimo ${minOrderAmount!.toLocaleString("es-AR")} para
                  delivery. Te faltan $
                  {(minOrderAmount! - subtotal).toLocaleString("es-AR")}.
                </p>
              )}

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 16,
                  marginTop: 4,
                }}
              >
                <button
                  onClick={handleConfirm}
                  disabled={loading || belowMinOrder}
                  style={{
                    width: "100%",
                    background:
                      loading || belowMinOrder ? "var(--surface-2)" : accent,
                    color:
                      loading || belowMinOrder
                        ? "var(--text-secondary)"
                        : onAccent,
                    fontWeight: 700,
                    fontSize: 16,
                    padding: "16px",
                    borderRadius: 14,
                    border: "none",
                    cursor:
                      loading || belowMinOrder ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: 16,
                          height: 16,
                          border: "2px solid currentColor",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} strokeWidth={2.5} />
                      Confirmar y enviar por WhatsApp
                    </>
                  )}
                </button>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
