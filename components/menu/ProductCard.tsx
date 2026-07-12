"use client";

import { memo } from "react";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/getRestaurant";
import Badge from "@/components/menu/Badge";
import { fmt, hexToRgba, highlightText } from "@/app/[slug]/catalogHelpers";

// ── ProductCard ── extraído con memo para evitar re-creación en cada render ──
const ProductCard = memo(function ProductCard({
  item,
  catEmoji,
  qty,
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  idx,
  onOpen,
  onAdd,
  onRemove,
  isFavorite,
  onToggleFavorite,
  onAddFly,
  highlightQuery,
}: {
  item: MenuItem;
  catEmoji: string;
  qty: number;
  accent: string;
  onAccent: string;
  SURFACE: string;
  SURFACE2: string;
  BORDER: string;
  TEXT1: string;
  TEXT2: string;
  idx?: number;
  onOpen: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (item: MenuItem) => void;
  onAddFly?: (item: MenuItem, el: HTMLElement) => void;
  highlightQuery?: string;
}) {
  const soldOut = item.badge === "Agotado";
  return (
    <div className="card-reveal product-card-lift">
      <div
        onClick={() => !soldOut && onOpen(item)}
        style={{
          display: "flex",
          flexDirection: "column",
          background: hexToRgba(SURFACE, 0.92),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 14,
          border: `1px solid ${qty > 0 ? accent + "30" : BORDER}`,
          cursor: soldOut ? "default" : "pointer",
          opacity: soldOut ? 0.7 : 1,
          boxShadow:
            qty > 0 ? `0 3px 16px ${accent}22` : "0 2px 8px rgba(0,0,0,0.07)",
          transition:
            "box-shadow 0.35s ease, border-color 0.2s, transform 0.2s",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          overflow: "hidden",
          position: "relative",
        }}
        onMouseMove={(e) => {
          if (!soldOut && window.matchMedia("(hover: hover)").matches) {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotX = (y / rect.height - 0.5) * -10;
            const rotY = (x / rect.width - 0.5) * 10;
            card.classList.remove("card-tilt-reset");
            card.classList.add("card-tilt");
            card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
            card.style.boxShadow =
              qty > 0
                ? `0 14px 36px ${accent}38`
                : "0 14px 32px rgba(0,0,0,0.18)";
            const img = card.querySelector(".card-img") as HTMLElement | null;
            if (img) img.style.transform = "scale(1.06)";
          }
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget;
          card.classList.add("card-tilt-reset");
          card.classList.remove("card-tilt");
          card.style.transform = "";
          card.style.boxShadow =
            qty > 0 ? `0 3px 16px ${accent}22` : "0 2px 8px rgba(0,0,0,0.07)";
          const img = card.querySelector(".card-img") as HTMLElement | null;
          if (img) img.style.transform = "scale(1)";
        }}
        onTouchStart={(e) => {
          if (!soldOut) e.currentTarget.style.transform = "scale(0.985)";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "";
        }}
        onTouchCancel={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        {/* Image top */}
        <div
          className="img-skeleton"
          style={{
            width: "100%",
            aspectRatio: "4/3",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
          }}
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              loading="lazy"
              className="card-img"
              style={{
                objectFit: "cover",
                transition: "transform 0.35s ease",
              }}
              onLoad={(e) => {
                (e.currentTarget.parentElement as HTMLElement).classList.remove(
                  "img-skeleton",
                );
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: accent + "99",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Badge PROMO flotante sobre la imagen */}
          {item.is_featured && !soldOut && (
            <div
              className="promo-badge-pulse"
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: accent,
                color: onAccent,
                fontSize: 9,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 999,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: `0 2px 8px ${accent}55`,
                zIndex: 3,
              }}
            >
              PROMO
            </div>
          )}
          {/* Overlay Agotado */}
          {soldOut && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                Agotado
              </span>
            </div>
          )}
          {/* Favorite button */}
          <button
            aria-label={
              isFavorite
                ? `Quitar ${item.name} de favoritos`
                : `Guardar ${item.name} en favoritos`
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: isFavorite ? "#EF4444" : "rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "none",
              WebkitAppearance: "none",
              appearance: "none",
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
              (e.currentTarget.style.transform = "scale(0.82)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.82)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Heart
              size={13}
              strokeWidth={isFavorite ? 0 : 2}
              fill={isFavorite ? "#fff" : "rgba(255,255,255,0.85)"}
              color={isFavorite ? "#fff" : "rgba(255,255,255,0.85)"}
            />
          </button>
        </div>

        {/* Content below image */}
        <div
          style={{
            padding: "12px 12px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "relative",
          }}
        >
          {/* Badge row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            {item.badge && item.badge !== "" && item.badge !== "Agotado" && (
              <Badge badge={item.badge} />
            )}
            {catEmoji && (
              <span
                style={{
                  fontSize: 10,
                  lineHeight: 1,
                  opacity: 0.55,
                  userSelect: "none",
                }}
              >
                {catEmoji}
              </span>
            )}
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: TEXT1,
              lineHeight: 1.3,
              display: "block",
            }}
          >
            {highlightQuery
              ? highlightText(item.name, highlightQuery, accent)
              : item.name}
          </span>
          {item.description && (
            <p
              style={{
                fontSize: 12,
                color: TEXT2,
                margin: 0,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient:
                  "vertical" as React.CSSProperties["WebkitBoxOrient"],
                overflow: "hidden",
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
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.extras && item.extras.length > 0
                ? `desde ${fmt(item.price)}`
                : fmt(item.price)}
            </span>
          </div>

          {item.extras && item.extras.length > 0 && (
            <span style={{ fontSize: 11, color: TEXT2 }}>• Personalizá</span>
          )}

          {/* Stepper or Add button */}
          {!soldOut && (
            <div style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
              {qty === 0 ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    aria-label={`Agregar ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                      onAddFly?.(item, e.currentTarget);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: accent,
                      color: onAccent,
                      border: "none",
                      WebkitAppearance: "none",
                      appearance: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: `0 3px 10px ${accent}55`,
                      transition:
                        "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    onTouchStart={(e) =>
                      (e.currentTarget.style.transform = "scale(0.82)")
                    }
                    onTouchEnd={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                    onMouseDown={(e) =>
                      (e.currentTarget.style.transform = "scale(0.88)")
                    }
                    onMouseUp={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <Plus size={15} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    background: SURFACE2,
                    borderRadius: 18,
                    padding: "3px 4px",
                    border: `1px solid ${accent}30`,
                  }}
                >
                  <button
                    aria-label={`Quitar uno de ${item.name}`}
                    onClick={() => onRemove(item)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "transparent",
                      border: "none",
                      WebkitAppearance: "none",
                      appearance: "none",
                      color: accent,
                      fontSize: 16,
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
                    key={qty}
                    className="qty-pop"
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      minWidth: 14,
                      textAlign: "center",
                      color: TEXT1,
                      display: "block",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    aria-label={`Agregar otro ${item.name}`}
                    onClick={() => onAdd(item)}
                    className="stepper-add-btn"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: accent,
                      border: "none",
                      WebkitAppearance: "none",
                      appearance: "none",
                      color: onAccent,
                      fontSize: 16,
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
