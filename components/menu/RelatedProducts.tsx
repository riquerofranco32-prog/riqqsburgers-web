"use client";

import type { MenuItem } from "@/lib/getRestaurant";

interface Props {
  currentId: string;
  categoryItems: MenuItem[];
  accent: string;
  onAccent: string;
  SURFACE: string;
  SURFACE2: string;
  BORDER: string;
  TEXT1: string;
  TEXT2: string;
  TEXTM: string;
  onOpen: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
  fmt: (n: number) => string;
  hexToRgba: (hex: string, alpha: number) => string;
}

export default function RelatedProducts({
  currentId,
  categoryItems,
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  TEXTM,
  onOpen,
  onAdd,
  fmt,
  hexToRgba,
}: Props) {
  const related = categoryItems
    .filter((i) => i.id !== currentId && i.badge !== "Agotado")
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 20,
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: TEXTM,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          marginBottom: 12,
        }}
      >
        También te puede gustar
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {related.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 12,
              border: `1px solid ${BORDER}`,
              background: hexToRgba(SURFACE, 0.6),
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onClick={() => onOpen(item)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hexToRgba(SURFACE2, 0.9);
              e.currentTarget.style.borderColor = accent + "30";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = hexToRgba(SURFACE, 0.6);
              e.currentTarget.style.borderColor = BORDER;
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = hexToRgba(SURFACE2, 0.9);
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = hexToRgba(SURFACE, 0.6);
            }}
          >
            {/* Imagen 40×40 */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: accent + "60",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {item.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Nombre + precio */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: TEXT1,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {item.name}
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: accent,
                  margin: "2px 0 0",
                }}
              >
                {fmt(item.price)}
              </p>
            </div>

            {/* Botón agregar */}
            <button
              aria-label={`Agregar ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              style={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: accent,
                color: onAccent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
                boxShadow: `0 2px 8px ${accent}40`,
                transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.88)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "scale(0.82)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
