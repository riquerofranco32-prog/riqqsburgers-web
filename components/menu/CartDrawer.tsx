"use client";

import { useState, useRef } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import type { MenuItem } from "@/lib/getRestaurant";

export type SelectedExtra = { name: string; price: number };
export type CartItem = MenuItem & {
  quantity: number;
  notes?: string;
  selectedExtra?: SelectedExtra;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function vibrate(ms = 40) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

interface RestaurantCategory {
  id: string;
  emoji: string;
  items: Array<{ id: string }>;
}

export interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  hasDelivery: boolean;
  deliveryCost: number;
  isOpen: boolean;
  orderNotes: string;
  onOrderNotesChange: (v: string) => void;
  accent: string;
  onAccent: string;
  SURFACE: string;
  SURFACE2: string;
  BORDER: string;
  TEXT1: string;
  TEXT2: string;
  TEXTM: string;
  restaurantPhone?: string;
  restaurantSchedule?: string;
  restaurantCategories: RestaurantCategory[];
  onClose: () => void;
  onCheckout: () => void;
  onClearCart: () => void;
  onAdd: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
  onRemoveAll: (item: CartItem) => void;
}

export default function CartDrawer({
  open,
  cart,
  totalItems,
  subtotal,
  hasDelivery,
  deliveryCost,
  isOpen,
  orderNotes,
  onOrderNotesChange,
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  TEXTM,
  restaurantPhone,
  restaurantSchedule,
  restaurantCategories,
  onClose,
  onCheckout,
  onClearCart,
  onAdd,
  onRemove,
  onRemoveAll,
}: CartDrawerProps) {
  const [clearConfirm, setClearConfirm] = useState(false);
  const [orderNotesOpen, setOrderNotesOpen] = useState(false);
  const [drawerDragOffset, setDrawerDragOffset] = useState(0);
  const swipeStart = useRef<number | null>(null);
  const isDragging = useRef(false);

  function onDrawerTouchStart(e: React.TouchEvent) {
    swipeStart.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function onDrawerTouchMove(e: React.TouchEvent) {
    if (swipeStart.current === null) return;
    const delta = e.touches[0].clientY - swipeStart.current;
    if (delta > 0) {
      isDragging.current = true;
      setDrawerDragOffset(delta);
    }
  }

  function onDrawerTouchEnd(e: React.TouchEvent) {
    if (swipeStart.current === null) return;
    const delta = e.changedTouches[0].clientY - swipeStart.current;
    swipeStart.current = null;
    isDragging.current = false;
    setDrawerDragOffset(0);
    if (delta > 120) {
      setClearConfirm(false);
      onClose();
      vibrate(30);
    }
  }

  return (
    <div className="contents lg:hidden">
      {open && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tu pedido"
            onTouchStart={onDrawerTouchStart}
            onTouchMove={onDrawerTouchMove}
            onTouchEnd={onDrawerTouchEnd}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              maxHeight: "88dvh",
              borderRadius: "24px 24px 0 0",
              background: SURFACE,
              borderTop: `2px solid ${accent}`,
              boxShadow: "0 -8px 48px rgba(0,0,0,0.2)",
              animation:
                drawerDragOffset > 0
                  ? "none"
                  : "sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)",
              transform: `translateY(${drawerDragOffset}px)`,
              transition:
                drawerDragOffset > 0
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              willChange: "transform",
            }}
          >
            {/* Drag handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 4px",
                cursor: "grab",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: BORDER,
                }}
              />
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px 14px",
                borderBottom: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={18} style={{ color: accent }} />
                <span style={{ fontWeight: 800, fontSize: 17, color: TEXT1 }}>
                  Tu pedido
                </span>
                <span
                  style={{
                    background: accent,
                    color: onAccent,
                    borderRadius: 20,
                    padding: "1px 8px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {totalItems}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {cart.length > 0 && !clearConfirm && (
                  <button
                    onClick={() => setClearConfirm(true)}
                    title="Vaciar carrito"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#ef4444",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <Trash2 size={12} />
                    Vaciar
                  </button>
                )}
                {clearConfirm && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: TEXT2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ¿Seguro?
                    </span>
                    <button
                      onClick={() => {
                        onClearCart();
                        setClearConfirm(false);
                        onClose();
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        background: "#ef4444",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Sí, vaciar
                    </button>
                    <button
                      onClick={() => setClearConfirm(false)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        background: SURFACE2,
                        border: `1px solid ${BORDER}`,
                        color: TEXT2,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setClearConfirm(false);
                    onClose();
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: SURFACE2,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEXT2,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {cart.map((item, index) => {
                const catEmoji =
                  restaurantCategories.find((c) =>
                    c.items.some((i) => i.id === item.id),
                  )?.emoji ?? "";
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      animation: `cardFadeIn 0.22s ease both`,
                      animationDelay: `${index * 0.04}s`,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: SURFACE2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        catEmoji
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: TEXT1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </p>
                      {item.selectedExtra && (
                        <p
                          style={{
                            fontSize: 11,
                            color: TEXTM,
                            marginTop: 2,
                          }}
                        >
                          {item.selectedExtra.name} (+
                          {fmt(item.selectedExtra.price)})
                        </p>
                      )}
                      {item.notes && (
                        <p
                          style={{
                            fontSize: 11,
                            color: TEXTM,
                            marginTop: 1,
                            fontStyle: "italic",
                          }}
                        >
                          {item.notes}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: TEXTM }}>
                        {fmt(item.price + (item.selectedExtra?.price ?? 0))} c/u
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() =>
                          item.quantity === 1
                            ? onRemoveAll(item)
                            : onRemove(item)
                        }
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: SURFACE2,
                          border: `1px solid ${BORDER}`,
                          color: TEXT2,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 size={11} />
                        ) : (
                          <Minus size={11} />
                        )}
                      </button>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          minWidth: 20,
                          textAlign: "center",
                          color: TEXT1,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onAdd(item)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: accent,
                          border: "none",
                          color: onAccent,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 60,
                        textAlign: "right",
                        color: TEXT1,
                      }}
                    >
                      {fmt(
                        (item.price + (item.selectedExtra?.price ?? 0)) *
                          item.quantity,
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div
              style={{
                borderTop: `1px solid ${BORDER}`,
                flexShrink: 0,
                padding: "12px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: TEXTM }}>Subtotal</span>
                <span style={{ fontSize: 13, color: TEXT2, fontWeight: 600 }}>
                  {fmt(subtotal)}
                </span>
              </div>
              {hasDelivery && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, color: TEXTM }}>Envío</span>
                  <span style={{ fontSize: 13, color: TEXT2 }}>
                    {fmt(deliveryCost)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: `1px solid ${BORDER}`,
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 18, color: TEXT1 }}>
                  Total
                </span>
                <span style={{ fontWeight: 900, fontSize: 20, color: accent }}>
                  {fmt(subtotal + (hasDelivery ? deliveryCost : 0))}
                </span>
              </div>
            </div>

            {/* Notas globales del pedido */}
            <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
              <button
                onClick={() => setOrderNotesOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: TEXTM,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 0",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <MessageCircle size={13} />
                {orderNotesOpen
                  ? "Cerrar aclaraciones"
                  : "Agregar aclaraciones del pedido"}
              </button>
              {orderNotesOpen && (
                <div style={{ marginTop: 8, position: "relative" }}>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= 200)
                        onOrderNotesChange(e.target.value);
                    }}
                    placeholder="Alérgenos, instrucciones especiales..."
                    rows={3}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      border: `1.5px solid ${BORDER}`,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: TEXT1,
                      background: SURFACE2,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = accent)
                    }
                    onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 10,
                      fontSize: 11,
                      color: orderNotes.length >= 180 ? "#ef4444" : TEXTM,
                    }}
                  >
                    {orderNotes.length}/200
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              style={{
                padding: `12px 16px`,
                paddingBottom: `max(16px, env(safe-area-inset-bottom, 16px))`,
                flexShrink: 0,
              }}
            >
              {!isOpen ? (
                <div
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#f87171",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    Local cerrado ahora
                  </span>
                  {restaurantSchedule && (
                    <span
                      style={{
                        color: TEXT2,
                        fontWeight: 400,
                        fontSize: 13,
                      }}
                    >
                      {restaurantSchedule}
                    </span>
                  )}
                  {restaurantPhone && (
                    <a
                      href={`https://wa.me/${restaurantPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola! ¿A qué hora abren hoy?")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        color: "#25d366",
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: "none",
                      }}
                    >
                      Preguntar horario por WhatsApp →
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={onCheckout}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    background: accent,
                    color: onAccent,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onTouchStart={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onTouchEnd={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Hacer pedido →
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
