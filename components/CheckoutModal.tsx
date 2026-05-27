"use client";

import { useState, useEffect } from "react";

export interface CheckoutCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CheckoutCartItem[];
  onClearCart: () => void;
  tenant: {
    id: string;
    name: string;
    slug: string;
    whatsapp_number: string;
    delivery_cost?: number;
    primary_color?: string;
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
  tenant,
}: CheckoutModalProps) {
  const accent = tenant.primary_color || "#FF6B35";
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const [loading, setLoading] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
  const grandTotal = subtotal + deliveryCost;

  useEffect(() => {
    if (!isOpen) {
      setDone(false);
      setError("");
      setOrderRef("");
      setLoading(false);
      setTouched({});
      setForm({
        name: "",
        lastname: "",
        phone: "",
        address: "",
        notes: "",
        delivery: "pickup",
        payment: "cash",
      });
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

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const nameError = touched.name && !form.name ? "Obligatorio" : "";
  const lastnameError = touched.lastname && !form.lastname ? "Obligatorio" : "";
  const addressError =
    touched.address && form.delivery === "delivery" && !form.address
      ? "Ingresá la dirección"
      : "";

  async function handleConfirm() {
    setTouched({ name: true, lastname: true, address: true });
    if (!form.name || !form.lastname) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    if (form.delivery === "delivery" && !form.address) {
      setError("Ingresá la dirección de entrega");
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
    const lines = [
      `🛒 *Nuevo pedido — ${tenant.name}*`,
      `📋 Ref: *${tempRef}*`,
      ``,
      `👤 *Cliente*`,
      `Nombre: ${form.name} ${form.lastname}`,
      form.phone ? `Tel: ${form.phone}` : null,
      ``,
      `📦 *Pedido*`,
      ...cart.map(
        (i) =>
          `• ${i.name} x${i.quantity} — $${(i.price * i.quantity).toLocaleString("es-AR")}`,
      ),
      ``,
      form.delivery === "delivery"
        ? `🚚 *Delivery* a: ${form.address}`
        : `🏠 *Retira en local*`,
      `💳 Pago: ${form.payment === "cash" ? "Efectivo" : "Transferencia"}`,
      deliveryCost > 0
        ? `🛵 Envío: $${deliveryCost.toLocaleString("es-AR")}`
        : null,
      ``,
      `💰 *Total: $${grandTotal.toLocaleString("es-AR")}*`,
      form.notes ? `\n📝 Nota: ${form.notes}` : null,
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
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          delivery_type: form.delivery,
          payment_method: form.payment,
          customer_name: `${form.name} ${form.lastname}`.trim(),
          customer_phone: form.phone || null,
          customer_address: form.delivery === "delivery" ? form.address : null,
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { order_ref: string; total: number };
        setOrderRef(data.order_ref);
      } else {
        setOrderRef(tempRef);
      }
    } catch {
      setOrderRef(tempRef);
    }

    setDone(true);
    onClearCart();
    setLoading(false);
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
    color: "var(--text-muted)",
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
        className="checkout-sheet"
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
        </div>

        {done ? (
          /* ── Success screen ───────────────────────────────────────────── */
          <div style={{ textAlign: "center", padding: "32px 24px 40px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2
              style={{
                color: "var(--text-primary)",
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              ¡Pedido enviado!
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Se abrió WhatsApp con tu pedido. Guardá el código para hacer el
              seguimiento.
            </p>
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
                  color: "var(--text-muted)",
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
              <button
                onClick={onClose}
                style={{
                  background: accent,
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Cerrar
              </button>
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
          <div style={{ padding: "20px 20px 32px" }}>
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
                color: "var(--text-muted)",
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              {tenant.name}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                <label style={labelBase}>Teléfono</label>
                <input
                  style={inputBase}
                  placeholder="11 1234-5678"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = accent)}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
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
                      label: "🏠 Retiro en local",
                      sub: "Gratis",
                    },
                    {
                      value: "delivery" as DeliveryType,
                      label: "🚚 Delivery",
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
                            ? `${accent}18`
                            : "var(--surface-2)",
                        color:
                          form.delivery === opt.value
                            ? accent
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
                    { value: "cash" as PaymentMethod, label: "💵 Efectivo" },
                    {
                      value: "transfer" as PaymentMethod,
                      label: "📲 Transferencia",
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
                            ? `${accent}18`
                            : "var(--surface-2)",
                        color:
                          form.payment === opt.value
                            ? accent
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
                      {i.name} ×{i.quantity}
                    </span>
                    <span>
                      ${(i.price * i.quantity).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                {deliveryCost > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span>🛵 Envío</span>
                    <span>${deliveryCost.toLocaleString("es-AR")}</span>
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
                  <span style={{ color: accent }}>
                    ${grandTotal.toLocaleString("es-AR")}
                  </span>
                </div>
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

              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "var(--surface-2)" : accent,
                  color: loading ? "var(--text-muted)" : "white",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "16px",
                  borderRadius: 14,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
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
                  "📲 Confirmar y enviar por WhatsApp"
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
