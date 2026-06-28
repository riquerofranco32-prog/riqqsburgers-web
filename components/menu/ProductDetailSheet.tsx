"use client";

import { useState } from "react";
import { X, Heart, Share2, CheckCircle2 } from "lucide-react";
import type { MenuItem } from "@/lib/getRestaurant";
import RelatedProducts from "@/components/menu/RelatedProducts";
import Badge from "@/components/menu/Badge";

type SelectedExtra = { name: string; price: number };

const TEXTM = "#999999";

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ProductDetailSheetProps {
  item: MenuItem;
  qty: number;
  catEmoji: string;
  categoryItems: MenuItem[];
  accent: string;
  onAccent: string;
  SURFACE: string;
  SURFACE2: string;
  BORDER: string;
  TEXT1: string;
  TEXT2: string;
  restaurantName: string;
  restaurantId: string;
  initialNotes: string;
  initialExtra: SelectedExtra | null;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: MenuItem) => void;
  onClose: () => void;
  onOpen: (item: MenuItem) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (item: MenuItem) => void;
  addItemWithNotes: (
    item: MenuItem,
    notes?: string,
    extra?: SelectedExtra,
  ) => void;
  updateNotes: (itemId: string, notes: string) => void;
  onLightbox: (src: string) => void;
}

export default function ProductDetailSheet({
  item,
  qty,
  catEmoji,
  categoryItems,
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  restaurantName,
  restaurantId,
  initialNotes,
  initialExtra,
  isFavorite,
  toggleFavorite,
  onClose,
  onOpen,
  addItem,
  removeItem,
  addItemWithNotes,
  updateNotes,
  onLightbox,
}: ProductDetailSheetProps) {
  const [itemNotesDraft, setItemNotesDraft] = useState(initialNotes);
  const [selectedExtraDraft, setSelectedExtraDraft] =
    useState<SelectedExtra | null>(initialExtra);
  const [sheetImageLoaded, setSheetImageLoaded] = useState(false);
  const [shareProductCopied, setShareProductCopied] = useState(false);

  const extraPrice = selectedExtraDraft?.price ?? 0;
  const totalPriceDisplay = item.price + extraPrice;
  const isSoldOut = item.badge === "Agotado";

  async function handleShareProduct(productId: string, productName: string) {
    const url = `${window.location.origin}${window.location.pathname}?producto=${productId}`;
    const shareData = {
      title: productName,
      text: `Mirá ${productName} en ${restaurantName}`,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareProductCopied(true);
      setTimeout(() => setShareProductCopied(false), 2000);
    }
  }

  return (
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
        aria-label={item.name}
        className="product-sheet-modal"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: SURFACE,
          borderRadius: "24px 24px 0 0",
          maxHeight: "84dvh",
          overflowY: "auto",
          maxWidth: 640,
          margin: "0 auto",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.2)",
          borderTop: `2px solid ${accent}`,
          animation: "sheetUp 0.3s cubic-bezier(0.22,1,0.36,1)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 0",
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

        {/* Image hero — tappable for lightbox */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            maxHeight: 320,
            overflow: "hidden",
            marginTop: 10,
            cursor: item.image ? "zoom-in" : "default",
          }}
          onClick={() => item.image && onLightbox(item.image)}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transform: sheetImageLoaded ? "scale(1)" : "scale(1.06)",
                transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
              }}
              onLoad={() => setSheetImageLoaded(true)}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
              }}
            >
              {catEmoji}
            </div>
          )}

          {/* Bottom gradient — más dramático */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "55%",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Favorite button — top left sobre la imagen */}
          <button
            aria-label={
              isFavorite(item.id)
                ? `Quitar ${item.name} de favoritos`
                : `Guardar ${item.name} en favoritos`
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item);
            }}
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isFavorite(item.id) ? "#EF4444" : "rgba(0,0,0,0.42)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: isFavorite(item.id)
                ? "none"
                : "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition:
                "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.15s",
              WebkitTapHighlightColor: "transparent",
              zIndex: 5,
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.85)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.85)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Heart
              size={15}
              strokeWidth={isFavorite(item.id) ? 0 : 2.2}
              fill={isFavorite(item.id) ? "#fff" : "rgba(255,255,255,0.9)"}
              color={isFavorite(item.id) ? "#fff" : "rgba(255,255,255,0.9)"}
            />
          </button>

          {/* Close button — top right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.42)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              WebkitTapHighlightColor: "transparent",
              zIndex: 5,
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div
          style={{
            padding: "20px 20px",
            paddingBottom: `max(28px, env(safe-area-inset-bottom, 28px))`,
          }}
        >
          {/* Feature 3: Banner agotado / badge de disponibilidad mejorado */}
          {isSoldOut ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.09)",
                border: "1px solid rgba(239,68,68,0.22)",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 15 }}>🚫</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#dc2626",
                }}
              >
                Agotado temporalmente
              </span>
            </div>
          ) : item.badge === "Popular" || item.badge === "Más pedido" ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                background: "rgba(22,163,74,0.10)",
                border: "1px solid rgba(22,163,74,0.25)",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13 }}>🔥</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                El más pedido
              </span>
            </div>
          ) : item.badge === "Nuevo" ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                background: "rgba(59,130,246,0.10)",
                border: "1px solid rgba(59,130,246,0.25)",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13 }}>✨</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                Nuevo
              </span>
            </div>
          ) : item.badge ? (
            <div style={{ marginBottom: 10 }}>
              <Badge badge={item.badge} />
            </div>
          ) : null}

          {/* Título + Feature 2: botón compartir producto */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: TEXT1,
                lineHeight: 1.2,
                flex: 1,
                margin: 0,
              }}
            >
              {item.name}
            </h2>
            <button
              onClick={() => void handleShareProduct(item.id, item.name)}
              aria-label="Compartir este producto"
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 999,
                border: `1.5px solid ${shareProductCopied ? "rgba(22,163,74,0.4)" : BORDER}`,
                background: "transparent",
                color: shareProductCopied ? "#16a34a" : TEXT2,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s",
                WebkitTapHighlightColor: "transparent",
                marginTop: 2,
              }}
            >
              {shareProductCopied ? (
                <>
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  Copiado
                </>
              ) : (
                <>
                  <Share2 size={12} strokeWidth={2.5} />
                  Compartir
                </>
              )}
            </button>
          </div>

          {item.description && (
            <p
              style={{
                fontSize: 14,
                color: TEXT2,
                lineHeight: 1.65,
                marginBottom: 16,
              }}
            >
              {item.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 28, color: accent }}>
              {fmt(totalPriceDisplay)}
            </span>
            {qty > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: TEXTM,
                  background: SURFACE2,
                  borderRadius: 8,
                  padding: "4px 10px",
                }}
              >
                En carrito: {qty}
              </span>
            )}
          </div>

          {/* Extras — opciones de tamaño */}
          {item.extras && item.extras.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  color: TEXTM,
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 10,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Tamaño
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Opción Simple = precio base */}
                <button
                  type="button"
                  onClick={() => setSelectedExtraDraft(null)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "1.5px solid",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      selectedExtraDraft === null ? accent : "transparent",
                    color: selectedExtraDraft === null ? onAccent : TEXT2,
                    borderColor: selectedExtraDraft === null ? accent : BORDER,
                    transition: "all 0.15s",
                  }}
                >
                  Simple
                </button>
                {item.extras.map((extra) => {
                  const isSelected = selectedExtraDraft?.name === extra.name;
                  return (
                    <button
                      type="button"
                      key={extra.name}
                      onClick={() =>
                        setSelectedExtraDraft(isSelected ? null : extra)
                      }
                      style={{
                        padding: "8px 18px",
                        borderRadius: 999,
                        border: "1.5px solid",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: isSelected ? accent : "transparent",
                        color: isSelected ? onAccent : TEXT2,
                        borderColor: isSelected ? accent : BORDER,
                        transition: "all 0.15s",
                      }}
                    >
                      {extra.name}{" "}
                      <span style={{ opacity: 0.8, fontSize: 12 }}>
                        +{fmt(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes field */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 11,
                color: TEXTM,
                fontWeight: 700,
                display: "block",
                marginBottom: 6,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Aclaraciones
            </label>
            <textarea
              value={itemNotesDraft}
              onChange={(e) => {
                setItemNotesDraft(e.target.value);
                if (qty > 0) updateNotes(item.id, e.target.value);
              }}
              placeholder="Ej: sin bacon, sin aderezos..."
              rows={2}
              style={{
                width: "100%",
                borderRadius: 10,
                border: `1.5px solid ${BORDER}`,
                padding: "10px 12px",
                fontSize: 14,
                color: TEXT1,
                background: SURFACE2,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>

          {isSoldOut ? (
            <div
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                background: SURFACE2,
                border: `1px solid ${BORDER}`,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: TEXTM,
                cursor: "default",
              }}
            >
              No disponible
            </div>
          ) : qty === 0 ? (
            <button
              onClick={() => {
                addItemWithNotes(
                  item,
                  itemNotesDraft || undefined,
                  selectedExtraDraft ?? undefined,
                );
                onClose();
              }}
              style={{
                width: "100%",
                background: accent,
                color: onAccent,
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
              onTouchStart={(e) => (e.currentTarget.style.opacity = "0.88")}
              onTouchEnd={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Agregar al pedido →
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: SURFACE2,
                    borderRadius: 12,
                    padding: "8px 14px",
                    flex: 1,
                    justifyContent: "space-between",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <button
                    onClick={() => removeItem(item)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: BORDER,
                      border: "none",
                      color: TEXT1,
                      fontSize: 22,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      minWidth: 28,
                      textAlign: "center",
                      color: TEXT1,
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => addItem(item)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: accent,
                      border: "none",
                      color: onAccent,
                      fontSize: 22,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: "0 20px",
                    height: 54,
                    background: SURFACE2,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: TEXT2,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Listo ✓
                </button>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: TEXTM,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Ya tenés {qty} en el carrito
              </p>
            </div>
          )}

          {/* Feature 1: También te puede gustar */}
          <RelatedProducts
            currentId={item.id}
            categoryItems={categoryItems}
            accent={accent}
            onAccent={onAccent}
            SURFACE={SURFACE}
            SURFACE2={SURFACE2}
            BORDER={BORDER}
            TEXT1={TEXT1}
            TEXT2={TEXT2}
            TEXTM={TEXTM}
            onOpen={onOpen}
            onAdd={addItem}
            fmt={fmt}
            hexToRgba={hexToRgba}
          />
        </div>
      </div>
      {/* Fade gradient — Mejora 9: indica scroll cuando el contenido es largo */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 640,
          height: 64,
          background: `linear-gradient(to top, ${SURFACE} 15%, transparent)`,
          pointerEvents: "none",
          zIndex: 51,
        }}
      />
    </>
  );
}
