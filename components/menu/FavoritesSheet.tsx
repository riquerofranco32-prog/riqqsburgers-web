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
  accent,
  onAccent,
  SURFACE,
  SURFACE2,
  BORDER,
  TEXT1,
  TEXT2,
  TEXTM,
}: Props) {
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
              borderRadius: "20px 20px 0 0",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: BORDER,
                margin: "12px auto 0",
                flexShrink: 0,
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 14px",
                borderBottom: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Heart size={18} style={{ color: "#EF4444" }} fill="#EF4444" />
                <span style={{ fontWeight: 700, fontSize: 16, color: TEXT1 }}>
                  Mis favoritos
                </span>
                {favorites.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#EF444418",
                      color: "#EF4444",
                      border: "1px solid #EF444430",
                      borderRadius: 999,
                      padding: "1px 7px",
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar favoritos"
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
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X size={16} color={TEXT2} />
              </button>
            </div>

            {/* Content */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}
            >
              {favorites.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 24px",
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: SURFACE2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Heart size={28} strokeWidth={1.5} color={TEXTM} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: TEXT2,
                        marginBottom: 6,
                      }}
                    >
                      Sin favoritos aún
                    </p>
                    <p style={{ fontSize: 13, color: TEXTM, lineHeight: 1.5 }}>
                      Guardá tus productos favoritos tocando el ❤️ en cada
                      producto
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
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
                          padding: "10px 12px",
                          background: SURFACE2,
                          borderRadius: 14,
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        {/* Image or placeholder */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 56,
                            height: 56,
                            borderRadius: 10,
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
                                fontSize: 22,
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
                              fontSize: 13,
                              fontWeight: 700,
                              color: TEXT1,
                              margin: "0 0 2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.name}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: accent,
                              margin: 0,
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
                            gap: 6,
                          }}
                        >
                          {/* Remove from favorites */}
                          <motion.button
                            aria-label={`Quitar ${product.name} de favoritos`}
                            onClick={() => onToggleFavorite(product)}
                            whileTap={{ scale: 0.82 }}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "#EF444418",
                              border: "none",
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
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: accent,
                              border: "none",
                              color: onAccent,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: `0 2px 8px ${accent}44`,
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
