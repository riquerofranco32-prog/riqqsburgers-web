"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/getRestaurant";

// ── Helpers (duplicados de CatalogClient para mantener independencia) ─────────

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

function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ImmersiveViewProps {
  products: (MenuItem & { catEmoji: string })[];
  accent: string;
  onAccent: string;
  SURFACE: string;
  TEXTM: string;
  onClose: () => void;
  onAdd: (item: MenuItem) => void;
  getQty: (id: string) => number;
  onOpenDetail?: (item: MenuItem) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImmersiveView({
  products,
  accent,
  onAccent,
  SURFACE,
  TEXTM,
  onClose,
  onAdd,
  getQty,
  onOpenDetail,
}: ImmersiveViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Mejora 10: swipe hint ──────────────────────────────────────────────────
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSwipeHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // Track which slide is visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setCurrentIdx(Math.min(Math.max(idx, 0), products.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [products.length]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (products.length === 0) return null;
  const progress =
    products.length > 1 ? (currentIdx / (products.length - 1)) * 100 : 100;

  return createPortal(
    <div className="immersive-container">
      {/* Close button */}
      <button
        className="immersive-close-btn"
        onClick={onClose}
        aria-label="Cerrar modo inmersivo"
      >
        <X size={17} strokeWidth={2.5} />
      </button>

      {/* Top bar: counter + progress */}
      <div className="immersive-top-bar">
        <div className="immersive-counter">
          {currentIdx + 1} / {products.length}
        </div>
        <div className="immersive-progress-track">
          <div
            className="immersive-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Swipe hint — Mejora 10 */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.75)",
          fontSize: 13,
          pointerEvents: "none",
          opacity: showSwipeHint ? 1 : 0,
          transition: "opacity 0.5s",
          zIndex: 10,
        }}
      >
        Deslizá para ver más
      </div>

      {/* Scroll-snap container */}
      <div className="immersive-scroll" ref={scrollRef}>
        {products.map((product) => {
          const qty = getQty(product.id);
          const isSoldOut = product.badge === "Agotado";
          return (
            <div key={product.id} className="immersive-slide">
              {/* Blurred background */}
              {product.image ? (
                <div
                  className="immersive-bg"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
              ) : (
                <div
                  className="immersive-bg-fallback"
                  style={{
                    background: `linear-gradient(135deg, ${accent}30 0%, #000 100%)`,
                  }}
                />
              )}

              {/* Foreground product image */}
              <div className="immersive-img-wrap">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="immersive-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="immersive-emoji-wrap">{product.catEmoji}</div>
                )}
              </div>

              {/* Info card — glassmorphism */}
              <div
                className="immersive-info-card"
                style={{ background: hexToRgba(SURFACE, 0.12) }}
              >
                {product.badge && product.badge !== "Agotado" && (
                  <div className="immersive-badge-pill">{product.badge}</div>
                )}
                <h2 className="immersive-title">{product.name}</h2>
                {product.description && (
                  <p className="immersive-desc">{product.description}</p>
                )}
                <div className="immersive-bottom">
                  <span className="immersive-price">{fmt(product.price)}</span>
                  {isSoldOut ? (
                    <div className="immersive-soldout">Agotado</div>
                  ) : qty > 0 ? (
                    <div className="immersive-in-cart">
                      <ShoppingCart size={13} />
                      En carrito: {qty}
                    </div>
                  ) : (
                    <button
                      className="immersive-add-btn"
                      style={{ background: accent, color: onAccent }}
                      onClick={() => {
                        vibrate(45);
                        if (product.extras && product.extras.length > 0) {
                          onOpenDetail?.(product);
                          onClose();
                        } else {
                          onAdd(product);
                        }
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
