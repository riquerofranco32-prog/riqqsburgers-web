"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart, Plus, ChevronDown } from "lucide-react";
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

// Arriba de esta relación de aspecto (ancho/alto) consideramos la imagen
// "panorámica" (banners de promo, gráficas con texto) — recortarla con
// cover la arruina, así que cae a contain. Fotos de producto más
// cuadradas/verticales sí se benefician de cover (llenan la pantalla,
// se sienten "TikTok" en vez de una miniatura chica).
const WIDE_IMAGE_RATIO = 1.35;

function ImmersiveProductImage({ src, alt }: { src: string; alt: string }) {
  const [isWide, setIsWide] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`immersive-img${isWide ? " immersive-img-contain" : ""}`}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth / img.naturalHeight > WIDE_IMAGE_RATIO) {
          setIsWide(true);
        }
      }}
    />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RestaurantHero {
  name: string;
  tagline: string;
  logo: string;
  banner: string;
}

export interface ImmersiveViewProps {
  products: (MenuItem & { catEmoji: string })[];
  accent: string;
  onAccent: string;
  TEXTM: string;
  onClose: () => void;
  onAdd: (item: MenuItem) => void;
  getQty: (id: string) => number;
  onOpenDetail?: (item: MenuItem) => void;
  restaurantHero?: RestaurantHero;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImmersiveView({
  products,
  accent,
  onAccent,
  onClose,
  onAdd,
  getQty,
  onOpenDetail,
  restaurantHero,
}: ImmersiveViewProps) {
  const hasHero = !!restaurantHero;
  const totalSlides = products.length + (hasHero ? 1 : 0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onProductSlide = currentIdx >= (hasHero ? 1 : 0);
  const productIdx = hasHero ? currentIdx - 1 : currentIdx;

  // ── Mejora 10: swipe hint (solo en la portada si hay hero, si no en el
  // primer producto) ──────────────────────────────────────────────────────
  const [showSwipeHint, setShowSwipeHint] = useState(!hasHero);
  useEffect(() => {
    if (hasHero) return;
    const t = setTimeout(() => setShowSwipeHint(false), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track which slide is visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setCurrentIdx(Math.min(Math.max(idx, 0), totalSlides - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [totalSlides]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (totalSlides === 0) return null;

  return createPortal(
    <div className="immersive-container">
      {/* Scrim superior — legibilidad sobre la foto full-bleed */}
      <div className="immersive-top-scrim" />

      {/* Close button */}
      <button
        className="immersive-close-btn"
        onClick={onClose}
        aria-label="Cerrar modo inmersivo"
      >
        <X size={17} strokeWidth={2.5} />
      </button>

      {/* Top bar: progreso segmentado — solo cuenta productos, no la portada */}
      {onProductSlide && (
        <div className="immersive-top-bar">
          <div className="immersive-progress-segments">
            {products.map((p, i) => (
              <div key={p.id} className="immersive-progress-segment">
                <div
                  className="immersive-progress-segment-fill"
                  style={i <= productIdx ? { width: "100%" } : undefined}
                />
              </div>
            ))}
          </div>
          <div className="immersive-counter">
            {productIdx + 1} / {products.length}
          </div>
        </div>
      )}

      {/* Swipe hint */}
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
        {/* Portada del negocio — primera slide, antes del feed de productos */}
        {restaurantHero && (
          <div className="immersive-slide immersive-hero-slide">
            {restaurantHero.banner ? (
              <div
                className="immersive-bg"
                style={{ backgroundImage: `url(${restaurantHero.banner})` }}
              />
            ) : (
              <div
                className="immersive-bg-fallback"
                style={{
                  background: `linear-gradient(135deg, ${accent}30 0%, #000 100%)`,
                }}
              />
            )}
            <div className="immersive-hero-content">
              {restaurantHero.logo && (
                <img
                  src={restaurantHero.logo}
                  alt={restaurantHero.name}
                  className="immersive-hero-logo"
                />
              )}
              <h1 className="immersive-hero-name">{restaurantHero.name}</h1>
              {restaurantHero.tagline && (
                <p className="immersive-hero-tagline">
                  {restaurantHero.tagline}
                </p>
              )}
              <div className="immersive-hero-scroll-cue">
                <ChevronDown size={20} strokeWidth={2.5} />
                Deslizá para ver el menú
              </div>
            </div>
          </div>
        )}

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
                  <ImmersiveProductImage
                    src={product.image}
                    alt={product.name}
                  />
                ) : (
                  <div className="immersive-emoji-wrap">{product.catEmoji}</div>
                )}
              </div>

              {/* Info — flota sobre un scrim degradado, la foto queda a pantalla completa */}
              <div className="immersive-info-card">
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
