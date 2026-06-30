"use client";

import { Heart, X, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FavoriteProduct } from "@/hooks/useFavorites";

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  open: boolean;
  onClose: () => void;
  favorites: FavoriteProduct[];
  onToggleFavorite: (product: FavoriteProduct) => void;
  onAddToCart: (product: FavoriteProduct) => void;
  onAddAll?: (products: FavoriteProduct[]) => void;
  accent: string;
  onAccent: string;
  SURFACE: string;
  SURFACE2: string;
  BORDER: string;
  TEXT1: string;
  TEXT2: string;
  TEXTM: string;
};

export default function FavoritesSheet({
  open,
  onClose,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onAddAll,
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  TEXTM,
}: Props) {
  const favTotal = favorites.reduce((s, p) => s + p.price, 0);
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="favorites-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 200,
            }}
          />

          {/* Drawer */}
          <motion.div
            key="favorites-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              background: SURFACE,
              borderRadius: "24px 24px 0 0",
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              boxShadow:
                "0 -12px 60px rgba(0,0,0,0.28), 0 -1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: BORDER,
                margin: "14px auto 0",
                flexShrink: 0,
                opacity: 0.6,
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px 16px",
                borderBottom: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#EF444412",
                    border: "1px solid #EF444425",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Heart
                    size={17}
                    style={{ color: "#EF4444" }}
                    fill="#EF4444"
                  />
                </div>
                <div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: TEXT1,
                      display: "block",
                      lineHeight: 1.2,
                    }}
                  >
                    Mis favoritos
                  </span>
                  {favorites.length > 0 && (
                    <span style={{ fontSize: 12, color: TEXTM }}>
                      {favorites.length}{" "}
                      {favorites.length === 1 ? "producto" : "productos"}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar favoritos"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: SURFACE2,
                  border: `1px solid ${BORDER}`,
                  WebkitAppearance: "none",
                  appearance: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X size={15} color={TEXT2} />
              </button>
            </div>

            {/* Content */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "14px 16px 16px" }}
            >
              {favorites.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "52px 24px",
                    textAlign: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 20,
                      background: SURFACE2,
                      border: `1px solid ${BORDER}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Heart size={30} strokeWidth={1.5} color={TEXTM} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: TEXT1,
                        marginBottom: 6,
                      }}
                    >
                      Sin favoritos aún
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: TEXTM,
                        lineHeight: 1.6,
                        maxWidth: 220,
                        margin: "0 auto",
                      }}
                    >
                      Tocá el ❤️ en cualquier producto para guardarlo acá
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <AnimatePresence initial={false}>
                    {favorites.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92, height: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          background: SURFACE2,
                          borderRadius: 16,
                          border: `1px solid ${BORDER}`,
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                        }}
                      >
                        {/* Image or placeholder */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 60,
                            height: 60,
                            borderRadius: 12,
                            overflow: "hidden",
                            background: `${accent}14`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: 24,
                                fontWeight: 900,
                                color: accent + "60",
                                userSelect: "none",
                              }}
                            >
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: TEXT1,
                              margin: "0 0 3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {product.name}
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: accent,
                              margin: 0,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {fmt(product.price)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {/* Remove from favorites */}
                          <motion.button
                            aria-label={`Quitar ${product.name} de favoritos`}
                            onClick={() => onToggleFavorite(product)}
                            whileTap={{ scale: 0.82 }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#EF444415",
                              border: "1px solid #EF444425",
                              WebkitAppearance: "none",
                              appearance: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            <Heart size={15} fill="#EF4444" color="#EF4444" />
                          </motion.button>

                          {/* Add to cart */}
                          <motion.button
                            aria-label={`Agregar ${product.name} al carrito`}
                            onClick={() => onAddToCart(product)}
                            whileTap={{ scale: 0.82 }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: accent,
                              border: "none",
                              WebkitAppearance: "none",
                              appearance: "none",
                              color: onAccent,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: `0 3px 10px ${accent}50`,
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            <ShoppingCart size={15} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer — add all to cart */}
            {favorites.length > 1 && onAddAll && (
              <div
                style={{
                  padding: "12px 16px",
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                  borderTop: `1px solid ${BORDER}`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: TEXTM, margin: 0 }}>
                    Total favoritos
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: accent,
                      margin: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmt(favTotal)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onAddAll(favorites);
                    onClose();
                  }}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 14,
                    background: accent,
                    border: "none",
                    color: onAccent,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: `0 4px 16px ${accent}40`,
                    WebkitTapHighlightColor: "transparent",
                    flexShrink: 0,
                  }}
                >
                  <ShoppingCart size={14} />
                  Agregar todo
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
