"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Minus, Plus, Trash2, Search, ShoppingBag } from "lucide-react";
import type {
  Restaurant,
  MenuItem,
  RestaurantBrand,
} from "@/lib/getRestaurant";
import CheckoutModal from "@/components/CheckoutModal";
import InfoRotator from "@/components/menu/InfoRotator";

type CartItem = MenuItem & { quantity: number; notes?: string };

function fmt(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

function vibrate(ms = 40) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

function hexToLuma(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const BADGE_META: Record<
  string,
  { bg: string; color: string; icon: string; label: string }
> = {
  Popular: { bg: "#fff3cd", color: "#92400e", icon: "🔥", label: "Popular" },
  Nuevo: { bg: "#dbeafe", color: "#1e40af", icon: "✨", label: "Nuevo" },
  Promo: { bg: "#fce7f3", color: "#9d174d", icon: "🏷️", label: "Promo" },
  Agotado: { bg: "#f3f4f6", color: "#6b7280", icon: "😴", label: "Agotado" },
  "Más pedido": {
    bg: "#fef9c3",
    color: "#854d0e",
    icon: "⭐",
    label: "Más pedido",
  },
};

function Badge({ badge }: { badge: string }) {
  const meta = BADGE_META[badge];
  if (!meta) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 6,
        background: meta.bg,
        color: meta.color,
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

// Mini toast for "Agregado"
function AddedToast({ visible, name }: { visible: boolean; name: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
        background: "#111",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 24,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 100,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      ✓ {name ? name.split(" ")[0] : "Producto"} agregado
    </div>
  );
}

export default function CatalogClient({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const CART_KEY = `cart_${restaurant.slug}`;
  const catBarRef = useRef<HTMLDivElement>(null);
  const catBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const catSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingToCat = useRef(false);
  const STICKY_OFFSET = 150; // search + cat bar height approx

  const [activeCategory, setActiveCategory] = useState(
    restaurant.menu.categories[0]?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<{
    name: string;
    key: number;
  } | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const [itemNotesDraft, setItemNotesDraft] = useState("");
  const prevTotal = useRef(0);

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const addItem = useCallback((item: MenuItem) => {
    vibrate(45);
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
    setAddedToast({ name: item.name, key: Date.now() });
  }, []);

  const removeItem = useCallback((item: MenuItem) => {
    vibrate(25);
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (!found) return prev;
      if (found.quantity === 1) return prev.filter((i) => i.id !== item.id);
      return prev.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }, []);

  const removeAll = useCallback((item: MenuItem) => {
    vibrate(30);
    setCart((prev) => prev.filter((i) => i.id !== item.id));
  }, []);

  const addItemWithNotes = useCallback((item: MenuItem, notes?: string) => {
    vibrate(45);
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found)
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1, notes: notes ?? i.notes }
            : i,
        );
      return [...prev, { ...item, quantity: 1, notes }];
    });
    setAddedToast({ name: item.name, key: Date.now() });
  }, []);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
  }, []);

  const getQty = (id: string) => cart.find((i) => i.id === id)?.quantity ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasDelivery = restaurant.delivery_cost > 0;

  // ── Sync notes draft when selected item changes ───────────────────────────

  useEffect(() => {
    if (!selectedItem) return;
    const existing = cart.find((i) => i.id === selectedItem.id);
    setItemNotesDraft(existing?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  // ── Toast auto-hide ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!addedToast) return;
    const t = setTimeout(() => setAddedToast(null), 1600);
    return () => clearTimeout(t);
  }, [addedToast]);

  // ── Cart bounce when count changes ────────────────────────────────────────

  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 400);
      prevTotal.current = totalItems;
      return () => clearTimeout(t);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  // ── Hydrate cart from localStorage (runs once on mount, client only) ─────

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    setCartHydrated(true);
  }, [CART_KEY]);

  // ── Persist cart (only after hydration to avoid overwriting saved state) ──

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, CART_KEY, cartHydrated]);

  // ── Body scroll lock ──────────────────────────────────────────────────────

  useEffect(() => {
    const locked = cartOpen || !!selectedItem || checkoutOpen;
    if (locked) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [cartOpen, selectedItem, checkoutOpen]);

  // ── ESC key ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedItem) setSelectedItem(null);
        else if (cartOpen) setCartOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cartOpen, selectedItem]);

  // ── Brand CSS variables ───────────────────────────────────────────────────

  useEffect(() => {
    const b = restaurant.brand;
    if (!b) return;
    const root = document.documentElement;
    root.style.setProperty("--bg", b.bg);
    root.style.setProperty("--surface", b.surface);
    root.style.setProperty("--surface-2", b.surface2);
    root.style.setProperty("--accent", b.accent);
    root.style.setProperty("--text-primary", b.text_primary);
    root.style.setProperty("--text-secondary", b.text_secondary);
    root.style.setProperty("--border", b.border);
    return () => {
      [
        "--bg",
        "--surface",
        "--surface-2",
        "--accent",
        "--text-primary",
        "--text-secondary",
        "--border",
      ].forEach((v) => root.style.removeProperty(v));
    };
  }, [restaurant.brand]);

  // ── Scroll-based active category (IntersectionObserver) ───────────────────

  useEffect(() => {
    if (searchQuery) return;
    const observers: IntersectionObserver[] = [];

    restaurant.menu.categories.forEach((cat) => {
      const el = catSectionRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrollingToCat.current) {
            setActiveCategory(cat.id);
            // Auto-scroll the pill into view
            const btn = catBtnRefs.current[cat.id];
            btn?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        },
        {
          threshold: 0.25,
          rootMargin: `-${STICKY_OFFSET}px 0px -45% 0px`,
        },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [restaurant.menu.categories, searchQuery]);

  // ── Click on category pill → smooth scroll to section ────────────────────

  function scrollToCategory(catId: string) {
    setActiveCategory(catId);
    isScrollingToCat.current = true;

    const el = catSectionRefs.current[catId];
    if (el) {
      const top =
        el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET + 8;
      window.scrollTo({ top, behavior: "smooth" });
    }

    // Auto-scroll pill into view
    catBtnRefs.current[catId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    // Release lock after scroll settles
    setTimeout(() => {
      isScrollingToCat.current = false;
    }, 800);
  }

  // ── Swipe to dismiss (cart drawer) ────────────────────────────────────────

  const swipeStart = useRef<number | null>(null);

  function onDrawerTouchStart(e: React.TouchEvent) {
    swipeStart.current = e.touches[0].clientY;
  }

  function onDrawerTouchEnd(e: React.TouchEvent) {
    if (swipeStart.current === null) return;
    const delta = e.changedTouches[0].clientY - swipeStart.current;
    swipeStart.current = null;
    if (delta > 80) {
      setCartOpen(false);
      vibrate(30);
    }
  }

  const b: RestaurantBrand | null = restaurant.brand ?? null;
  const accent = b?.accent ?? restaurant.accent_color;
  const onAccent = hexToLuma(accent) < 140 ? "#fff" : "#111";

  const BG = b?.bg ?? "#F4F4F4";
  const SURFACE = b?.surface ?? "#FFFFFF";
  const SURFACE2 = b?.surface2 ?? "#F0F0F0";
  const BORDER = b?.border ?? "#E8E8E8";
  const TEXT1 = b?.text_primary ?? "#111111";
  const TEXT2 = b?.text_secondary ?? "#555555";
  const TEXTM = "#999999";

  const infoItems = [
    restaurant.schedule && { icon: "🕐", text: restaurant.schedule },
    restaurant.address && { icon: "📍", text: restaurant.address },
    restaurant.phone && { icon: "📞", text: restaurant.phone },
    restaurant.instagram && { icon: "📸", text: `@${restaurant.instagram}` },
  ].filter(Boolean) as { icon: string; text: string }[];

  // All products flat for search
  const searchResults = restaurant.menu.categories
    .flatMap((c) =>
      c.items.map((item) => ({
        ...item,
        _catEmoji: c.emoji,
        _catName: c.name,
      })),
    )
    .filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  // ── Product card ─────────────────────────────────────────────────────────

  function ProductCard({
    item,
    catEmoji,
    accent,
    onAccent,
    SURFACE,
    SURFACE2,
    BORDER,
    TEXT1,
    TEXT2,
    idx,
  }: {
    item: MenuItem;
    catEmoji: string;
    accent: string;
    onAccent: string;
    SURFACE: string;
    SURFACE2: string;
    BORDER: string;
    TEXT1: string;
    TEXT2: string;
    idx?: number;
  }) {
    const qty = getQty(item.id);
    const soldOut = item.badge === "Agotado";

    return (
      <div
        style={{
          animation: `cardFadeIn 0.32s cubic-bezier(0.22,1,0.36,1) both`,
          animationDelay: `${Math.min((idx ?? 0) * 0.05, 0.4)}s`,
        }}
      >
        <div
          onClick={() => !soldOut && setSelectedItem(item)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            background: SURFACE,
            borderRadius: 16,
            padding: 14,
            marginBottom: 8,
            opacity: soldOut ? 0.55 : 1,
            boxShadow:
              qty > 0 ? `0 3px 16px ${accent}22` : "0 1px 4px rgba(0,0,0,0.06)",
            border: `1.5px solid ${qty > 0 ? accent + "30" : BORDER}`,
            cursor: soldOut ? "default" : "pointer",
            WebkitTapHighlightColor: "transparent",
            transition: "box-shadow 0.2s, border-color 0.2s",
            userSelect: "none",
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
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: TEXT1,
                lineHeight: 1.3,
                display: "block",
                marginBottom: 3,
              }}
            >
              {item.name}
            </span>

            {item.badge && item.badge !== "" && (
              <div style={{ marginBottom: 5 }}>
                <Badge badge={item.badge} />
              </div>
            )}

            {item.description && (
              <p
                style={{
                  fontSize: 13,
                  color: TEXT2,
                  margin: "0 0 8px",
                  lineHeight: 1.5,
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
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 16, color: accent }}>
                {fmt(item.price)}
              </span>

              {/* Inline stepper when no image */}
              {!item.image && !soldOut && qty > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: SURFACE2,
                    borderRadius: 20,
                    padding: "4px 8px",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <button
                    onClick={() => removeItem(item)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: BORDER,
                      border: "none",
                      color: TEXT1,
                      fontSize: 18,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      minWidth: 18,
                      textAlign: "center",
                      color: TEXT1,
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => addItem(item)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: accent,
                      border: "none",
                      color: onAccent,
                      fontSize: 18,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: image + button */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 12,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
                  border: `1.5px solid ${accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                }}
              >
                {catEmoji}
              </div>
            )}

            {!soldOut &&
              (qty === 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(item);
                  }}
                  style={{
                    position: "absolute",
                    bottom: -7,
                    right: -7,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: accent,
                    color: onAccent,
                    border: `3px solid ${SURFACE}`,
                    fontSize: 22,
                    fontWeight: 300,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 3px 10px ${accent}55`,
                    transition: "transform 0.1s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onTouchStart={(e) =>
                    (e.currentTarget.style.transform = "scale(0.86)")
                  }
                  onTouchEnd={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.9)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  +
                </button>
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    bottom: -11,
                    right: -7,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: SURFACE,
                    borderRadius: 20,
                    padding: "3px 6px",
                    boxShadow: `0 2px 10px ${accent}40`,
                    border: `1.5px solid ${accent}30`,
                  }}
                >
                  <button
                    onClick={() => removeItem(item)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: accent + "18",
                      border: "none",
                      color: accent,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      minWidth: 16,
                      textAlign: "center",
                      color: TEXT1,
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => addItem(item)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: accent,
                      border: "none",
                      color: onAccent,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={
        {
          minHeight: "100vh",
          backgroundColor: BG,
          color: TEXT1,
          "--accent": accent,
          "--surface": SURFACE,
          "--surface-2": SURFACE2,
          "--border": BORDER,
          "--text-primary": TEXT1,
          "--text-secondary": TEXT2,
        } as React.CSSProperties
      }
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "36px 20px 28px",
        }}
      >
        {/* Background: banner o gradiente de color del negocio */}
        {restaurant.banner_url ? (
          <>
            <img
              src={restaurant.banner_url}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(160deg, ${accent}cc 0%, rgba(0,0,0,0.55) 100%)`,
                zIndex: 1,
              }}
            />
          </>
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(145deg, ${accent} 0%, ${accent}99 60%, ${accent}55 100%)`,
                zIndex: 0,
              }}
            />
            {/* Grain texture */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                opacity: 0.06,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "180px",
              }}
            />
            {/* Glow spot */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "70%",
                paddingTop: "70%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                filter: "blur(40px)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* Status badge */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            zIndex: 10,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: restaurant.is_open
                ? "rgba(22,163,74,0.9)"
                : "rgba(220,38,38,0.9)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#fff",
                display: "inline-block",
                animation: restaurant.is_open
                  ? "blink 2s ease-in-out infinite"
                  : undefined,
              }}
            />
            {restaurant.is_open ? "Abierto" : "Cerrado"}
          </span>
        </div>

        {/* Content: logo + nombre + ticker */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            maxWidth: 640,
            width: "100%",
          }}
        >
          {/* Logo grande */}
          {restaurant.logo && (
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 28,
                overflow: "hidden",
                border: "3px solid rgba(255,255,255,0.5)",
                boxShadow:
                  "0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
                marginBottom: 14,
                flexShrink: 0,
              }}
            >
              <img
                src={restaurant.logo}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              textAlign: "center",
              lineHeight: 1.15,
              marginBottom: restaurant.tagline ? 5 : 12,
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              fontFamily: b?.display_font
                ? `'${b.display_font}', sans-serif`
                : "inherit",
            }}
          >
            {restaurant.name}
          </h1>

          {restaurant.tagline && (
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.78)",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {restaurant.tagline}
            </p>
          )}

          {infoItems.length > 0 && (
            <InfoRotator
              items={infoItems}
              accent={accent}
              textColor="rgba(255,255,255,0.88)"
              maskColor="transparent"
            />
          )}
        </div>
      </header>

      {/* Closed notice */}
      {!restaurant.is_open && (
        <div
          style={{
            background: "rgba(220,38,38,0.07)",
            borderBottom: "1px solid rgba(220,38,38,0.12)",
            padding: "9px 16px",
            textAlign: "center",
            fontSize: 13,
            color: "#dc2626",
            fontWeight: 600,
          }}
        >
          🔒 Cerrado por ahora. Podés explorar la carta igual.
        </div>
      )}

      {/* ── Sticky: Search + Categories ──────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: BG,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Search */}
        <div style={{ padding: "10px 16px 6px" }}>
          <div
            style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: TEXTM,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el menú..."
              style={{
                width: "100%",
                borderRadius: 999,
                border: `1.5px solid ${BORDER}`,
                padding: "11px 36px 11px 36px",
                background: SURFACE,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                fontSize: 14,
                color: TEXT1,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: SURFACE2,
                  border: "none",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: TEXTM,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        {!searchQuery && (
          <div
            ref={catBarRef}
            style={{
              display: "flex",
              gap: 8,
              padding: "4px 16px 10px",
              overflowX: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {restaurant.menu.categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    catBtnRefs.current[cat.id] = el;
                  }}
                  onClick={() => scrollToCategory(cat.id)}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "8px 14px",
                    borderRadius: 14,
                    border: isActive ? "none" : `1.5px solid ${BORDER}`,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: isActive ? accent : SURFACE,
                    color: isActive ? onAccent : TEXT2,
                    boxShadow: isActive
                      ? `0 4px 16px ${accent}45`
                      : "0 1px 3px rgba(0,0,0,0.05)",
                    WebkitTapHighlightColor: "transparent",
                    minWidth: 56,
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>
                    {cat.emoji}
                  </span>
                  <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                    {cat.name}
                  </span>
                  {cat.items.length > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        fontSize: 9,
                        fontWeight: 800,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: isActive
                          ? "rgba(255,255,255,0.28)"
                          : SURFACE2,
                        color: isActive ? onAccent : TEXTM,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1.5px solid ${isActive ? "transparent" : BORDER}`,
                      }}
                    >
                      {cat.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Products ─────────────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: 640, margin: "0 auto", padding: "8px 12px 120px" }}
      >
        {/* ── Search results ── */}
        {searchQuery ? (
          <>
            <p
              style={{
                fontSize: 12,
                color: TEXTM,
                marginBottom: 10,
                paddingLeft: 4,
                animation: "fadeIn 0.2s ease both",
              }}
            >
              {searchResults.length} resultado
              {searchResults.length !== 1 ? "s" : ""} para &ldquo;{searchQuery}
              &rdquo;
            </p>
            {searchResults.length > 0 ? (
              searchResults.map((item, idx) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  catEmoji={
                    (item as typeof item & { _catEmoji: string })._catEmoji ??
                    "🍽️"
                  }
                  accent={accent}
                  onAccent={onAccent}
                  SURFACE={SURFACE}
                  SURFACE2={SURFACE2}
                  BORDER={BORDER}
                  TEXT1={TEXT1}
                  TEXT2={TEXT2}
                  idx={idx}
                />
              ))
            ) : (
              <div
                style={{ textAlign: "center", padding: "64px 0", color: TEXTM }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: SURFACE2,
                    margin: "0 auto 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                  }}
                >
                  🔍
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: TEXT2,
                    marginBottom: 6,
                  }}
                >
                  Sin resultados
                </p>
                <p style={{ fontSize: 13 }}>
                  No encontramos &ldquo;{searchQuery}&rdquo; en el menú
                </p>
              </div>
            )}
          </>
        ) : (
          /* ── All categories (scroll-based) ── */
          restaurant.menu.categories.map((cat, catIndex) => (
            <div
              key={cat.id}
              ref={(el) => {
                catSectionRefs.current[cat.id] = el;
              }}
            >
              {/* Category section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 4px 10px",
                  animation: "catHeaderIn 0.28s ease both",
                  animationDelay: `${catIndex * 0.06}s`,
                }}
              >
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: TEXT1 }}>
                  {cat.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: BORDER,
                    marginLeft: 4,
                  }}
                />
                <span style={{ fontSize: 11, color: TEXTM }}>
                  {cat.items.length}
                </span>
              </div>

              {cat.items.length > 0 ? (
                cat.items.map((item, idx) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    catEmoji={cat.emoji}
                    accent={accent}
                    onAccent={onAccent}
                    SURFACE={SURFACE}
                    SURFACE2={SURFACE2}
                    BORDER={BORDER}
                    TEXT1={TEXT1}
                    TEXT2={TEXT2}
                    idx={idx}
                  />
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: TEXTM,
                  }}
                >
                  <p style={{ fontSize: 13 }}>Próximamente</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AddedToast visible={!!addedToast} name={addedToast?.name ?? ""} />

      {/* ── Cart bar ─────────────────────────────────────────────────────────── */}
      {totalItems > 0 && !selectedItem && !cartOpen && (
        <button
          onClick={() => {
            vibrate(50);
            setCartOpen(true);
          }}
          style={
            {
              position: "fixed",
              bottom: `max(16px, env(safe-area-inset-bottom, 16px))`,
              left: 16,
              right: 16,
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              background: accent,
              color: onAccent,
              border: "none",
              borderRadius: 18,
              padding: "15px 18px",
              cursor: "pointer",
              boxShadow: `0 8px 32px ${accent}55`,
              WebkitTapHighlightColor: "transparent",
              maxWidth: 608,
              marginLeft: "auto",
              marginRight: "auto",
              animation: cartBounce
                ? "cartPop 0.35s cubic-bezier(0.36,0.07,0.19,0.97)"
                : "cartEnter 0.3s cubic-bezier(0.22,1,0.36,1)",
            } as React.CSSProperties
          }
        >
          <span
            style={{
              background: "rgba(255,255,255,0.25)",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 13,
              fontWeight: 800,
              minWidth: 32,
              textAlign: "center",
              animation: cartBounce ? "badgePop 0.35s ease" : undefined,
            }}
          >
            {totalItems}
          </span>
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Ver pedido
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 15 }}>
              {fmt(subtotal)}
            </span>
            {hasDelivery && (
              <span style={{ fontSize: 10, opacity: 0.75 }}>
                + envío {fmt(restaurant.delivery_cost)}
              </span>
            )}
          </div>
        </button>
      )}

      {/* ── Cart drawer ──────────────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setCartOpen(false)}
          />
          <div
            onTouchStart={onDrawerTouchStart}
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
              animation: "sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)",
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
                <ShoppingBag size={18} style={{ color: accent }} />
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
              <button
                onClick={() => setCartOpen(false)}
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
                  restaurant.menu.categories.find((c) =>
                    c.items.some((i) => i.id === item.id),
                  )?.emoji ?? "🍽️";
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
                        {fmt(item.price)} c/u
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
                            ? removeAll(item)
                            : removeItem(item)
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
                        onClick={() => addItem(item)}
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
                      {fmt(item.price * item.quantity)}
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
                    {fmt(restaurant.delivery_cost)}
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
                  {fmt(subtotal + (hasDelivery ? restaurant.delivery_cost : 0))}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                padding: `12px 16px`,
                paddingBottom: `max(16px, env(safe-area-inset-bottom, 16px))`,
                flexShrink: 0,
              }}
            >
              {!restaurant.is_open ? (
                <div
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#f87171",
                    fontSize: 15,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  🚫 El local está cerrado — no acepta pedidos ahora
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
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

      {/* ── Product detail sheet ─────────────────────────────────────────────── */}
      {selectedItem &&
        (() => {
          const qty = getQty(selectedItem.id);
          const catEmoji =
            restaurant.menu.categories.find((c) =>
              c.items.some((i) => i.id === selectedItem.id),
            )?.emoji ?? "🍽️";
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
                onClick={() => setSelectedItem(null)}
              />
              <div
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

                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit: "cover",
                      marginTop: 10,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 140,
                      marginTop: 10,
                      background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 60,
                    }}
                  >
                    {catEmoji}
                  </div>
                )}

                <div
                  style={{
                    padding: "20px 20px",
                    paddingBottom: `max(28px, env(safe-area-inset-bottom, 28px))`,
                  }}
                >
                  {selectedItem.badge && (
                    <div style={{ marginBottom: 10 }}>
                      <Badge badge={selectedItem.badge} />
                    </div>
                  )}

                  <h2
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      color: TEXT1,
                      marginBottom: 8,
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedItem.name}
                  </h2>

                  {selectedItem.description && (
                    <p
                      style={{
                        fontSize: 14,
                        color: TEXT2,
                        lineHeight: 1.65,
                        marginBottom: 16,
                      }}
                    >
                      {selectedItem.description}
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
                    <span
                      style={{ fontWeight: 900, fontSize: 28, color: accent }}
                    >
                      {fmt(selectedItem.price)}
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
                        if (qty > 0)
                          updateNotes(selectedItem.id, e.target.value);
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
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = accent)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = BORDER)
                      }
                    />
                  </div>

                  {qty === 0 ? (
                    <button
                      onClick={() => {
                        addItemWithNotes(
                          selectedItem,
                          itemNotesDraft || undefined,
                        );
                        setSelectedItem(null);
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
                      onTouchStart={(e) =>
                        (e.currentTarget.style.opacity = "0.88")
                      }
                      onTouchEnd={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      Agregar al pedido →
                    </button>
                  ) : (
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
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
                          onClick={() => removeItem(selectedItem)}
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
                          onClick={() => addItem(selectedItem)}
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
                        onClick={() => setSelectedItem(null)}
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
                  )}
                </div>
              </div>
            </>
          );
        })()}

      {/* ── Powered by Takefyy ───────────────────────────────────────────────── */}
      {totalItems === 0 && (
        <a
          href="https://takefyy.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
            right: 12,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(14,17,22,0.78)",
            backdropFilter: "blur(12px)",
            borderRadius: 20,
            padding: "5px 11px 5px 6px",
            border: "1px solid rgba(255,255,255,0.1)",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <img
            src="/takefyy-logo.png"
            alt="Takefyy"
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
          >
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Powered by
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#fff",
                fontWeight: 800,
                letterSpacing: "0.02em",
                marginTop: 1,
              }}
            >
              Takefyy
            </span>
          </div>
        </a>
      )}

      {/* ── Checkout ─────────────────────────────────────────────────────────── */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes,
        }))}
        onClearCart={() => setCart([])}
        tenant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          whatsapp_number: restaurant.phone,
          delivery_cost: restaurant.delivery_cost,
          primary_color: restaurant.primary_color,
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes sheetUp {
          from { transform: translateY(40px); opacity: 0.7; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
        @keyframes cartEnter {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes cartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.04); }
          60%  { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes badgePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .menu-grid-enter > * {
          animation: menuFadeIn 0.18s ease both;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes catHeaderIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `,
        }}
      />
    </div>
  );
}
