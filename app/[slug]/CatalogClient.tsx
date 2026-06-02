"use client";

import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  Flame,
  Sparkles,
  Tag,
  XCircle,
  Star,
  UtensilsCrossed,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type {
  Restaurant,
  MenuItem,
  RestaurantBrand,
} from "@/lib/getRestaurant";
import CheckoutModal from "@/components/CheckoutModal";
import InfoRotator from "@/components/menu/InfoRotator";
import MenuHeroShader from "@/components/menu/MenuHeroShader";
import MenuBackground from "@/components/menu/MenuBackground";

type SelectedExtra = { name: string; price: number };
type CartItem = MenuItem & {
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

function hexToLuma(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const BADGE_META: Record<string, { color: string; label: string }> = {
  Popular: { color: "#EA580C", label: "Popular" },
  Nuevo: { color: "#2563EB", label: "Nuevo" },
  Promo: { color: "#DC2626", label: "Promo" },
  Agotado: { color: "#6B7280", label: "Agotado" },
  "Más pedido": { color: "#B45309", label: "Más pedido" },
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Popular: Flame,
  Nuevo: Sparkles,
  Promo: Tag,
  Agotado: XCircle,
  "Más pedido": Star,
};

function Badge({ badge }: { badge: string }) {
  const meta = BADGE_META[badge];
  const Icon = BADGE_ICONS[badge];
  if (!meta) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: meta.color + "18",
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {Icon && <Icon size={9} strokeWidth={2.5} />}
      {meta.label}
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
      <CheckCircle2 size={13} strokeWidth={2.5} style={{ marginRight: 4 }} />
      {name ? name.split(" ")[0] : "Producto"} agregado
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
  const heroRef = useRef<HTMLElement>(null);
  const heroRafRef = useRef<number>(0);
  const glowRef = useRef<HTMLDivElement>(null);
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
  const [selectedExtraDraft, setSelectedExtraDraft] =
    useState<SelectedExtra | null>(null);
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

  const addItemWithNotes = useCallback(
    (item: MenuItem, notes?: string, selectedExtra?: SelectedExtra) => {
      vibrate(45);
      setCart((prev) => {
        const found = prev.find((i) => i.id === item.id);
        if (found)
          return prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  notes: notes ?? i.notes,
                  selectedExtra: selectedExtra ?? i.selectedExtra,
                }
              : i,
          );
        return [...prev, { ...item, quantity: 1, notes, selectedExtra }];
      });
      setAddedToast({ name: item.name, key: Date.now() });
    },
    [],
  );

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
  }, []);

  const getQty = (id: string) => cart.find((i) => i.id === id)?.quantity ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce(
    (s, i) => s + (i.price + (i.selectedExtra?.price ?? 0)) * i.quantity,
    0,
  );
  const hasDelivery = restaurant.delivery_cost > 0;

  // ── Sync notes draft when selected item changes ───────────────────────────

  useEffect(() => {
    if (!selectedItem) return;
    const existing = cart.find((i) => i.id === selectedItem.id);
    setItemNotesDraft(existing?.notes ?? "");
    setSelectedExtraDraft(existing?.selectedExtra ?? null);
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

  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    cancelAnimationFrame(heroRafRef.current);
    heroRafRef.current = requestAnimationFrame(() => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect || !glowRef.current) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      glowRef.current.style.left = `calc(${x * 100}% - 300px)`;
      glowRef.current.style.top = `calc(${y * 100}% - 300px)`;
    });
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
          animationDelay: `${Math.min((idx ?? 0) * 0.04, 0.3)}s`,
        }}
      >
        <div
          onClick={() => !soldOut && setSelectedItem(item)}
          style={{
            background: SURFACE,
            borderRadius: 16,
            border: `1.5px solid ${qty > 0 ? accent + "30" : BORDER}`,
            overflow: "hidden",
            cursor: soldOut ? "default" : "pointer",
            opacity: soldOut ? 0.6 : 1,
            boxShadow:
              qty > 0 ? `0 3px 16px ${accent}22` : "0 1px 6px rgba(0,0,0,0.07)",
            transition: "box-shadow 0.2s, border-color 0.2s",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
          onTouchStart={(e) => {
            if (!soldOut) e.currentTarget.style.transform = "scale(0.97)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "";
          }}
          onTouchCancel={(e) => {
            e.currentTarget.style.transform = "";
          }}
        >
          {/* ── Image area ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${accent}16, ${accent}06)`,
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
                  display: "block",
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
                  background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: accent + "50",
                    fontFamily:
                      "var(--font-playfair, 'Playfair Display', serif)",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Soldout overlay */}
            {soldOut && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "rgba(0,0,0,0.5)",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  Agotado
                </span>
              </div>
            )}

            {/* Add / stepper button */}
            {!soldOut && (
              <div
                style={{ position: "absolute", bottom: 8, right: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                {qty === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(item);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: accent,
                      color: onAccent,
                      border: `2.5px solid ${SURFACE}`,
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      background: SURFACE,
                      borderRadius: 18,
                      padding: "3px 5px",
                      boxShadow: `0 2px 10px ${accent}40`,
                      border: `1.5px solid ${accent}30`,
                    }}
                  >
                    <button
                      onClick={() => removeItem(item)}
                      style={{
                        width: 26,
                        height: 26,
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
                        WebkitTapHighlightColor: "transparent",
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
                        width: 26,
                        height: 26,
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

          {/* ── Text area ── */}
          <div style={{ padding: "10px 12px 12px" }}>
            {item.badge && item.badge !== "" && (
              <div style={{ marginBottom: 4 }}>
                <Badge badge={item.badge} />
              </div>
            )}
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: TEXT1,
                lineHeight: 1.3,
                display: "block",
                marginBottom: 3,
              }}
            >
              {item.name}
            </span>
            {item.description && (
              <p
                style={{
                  fontSize: 12,
                  color: TEXT2,
                  margin: "0 0 6px",
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
            <span style={{ fontWeight: 800, fontSize: 15, color: accent }}>
              {fmt(item.price)}
            </span>
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
      <MenuBackground accentColor={accent} />
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
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
          {/* Background: video > banner > gradiente de color */}
          {restaurant.hero_video_url ? (
            <>
              <video
                src={restaurant.hero_video_url}
                autoPlay
                muted
                loop
                playsInline
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
                  background: "rgba(0,0,0,0.50)",
                  zIndex: 1,
                }}
              />
            </>
          ) : restaurant.banner_url ? (
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
              {/* Shader animado con el color del restaurante */}
              <MenuHeroShader accent={accent} />
            </>
          )}

          {/* Mouse-tracking glow — DOM directo, sin re-render */}
          <div
            ref={glowRef}
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 3,
              left: "calc(50% - 300px)",
              top: "calc(50% - 300px)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 65%)",
              transition: "left 0.55s ease, top 0.55s ease",
            }}
          />
          {/* Static ambient glow — visible on mobile */}
          <div
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 3,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 60%)",
            }}
          />

          {/* Orbiting glow A — primary white */}
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 4,
              left: "50%",
              top: "50%",
              marginLeft: -180,
              marginTop: -180,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)",
              animation: "glowOrbit 7s ease-in-out infinite",
            }}
          />

          {/* Orbiting glow B — offset phase, accent-tinted */}
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 4,
              left: "50%",
              top: "50%",
              marginLeft: -140,
              marginTop: -140,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 60%)",
              animation: "glowOrbit 11s ease-in-out infinite reverse",
            }}
          />

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
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: restaurant.is_open
                  ? "rgba(22,163,74,0.85)"
                  : "rgba(100,100,100,0.75)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                letterSpacing: "0.02em",
              }}
            >
              {restaurant.is_open ? (
                <CheckCircle2 size={11} strokeWidth={2.5} />
              ) : (
                <XCircle size={11} strokeWidth={2.5} />
              )}
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
            {/* Logo flotante */}
            {restaurant.logo && (
              <div
                style={{
                  position: "relative",
                  marginBottom: 14,
                  animation:
                    "heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both",
                }}
              >
                {/* Halo pulsante detrás del logo */}
                <div
                  style={{
                    position: "absolute",
                    inset: -14,
                    borderRadius: 42,
                    background: "rgba(255,255,255,0.15)",
                    filter: "blur(18px)",
                    animation: "logoPulse 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 28,
                    overflow: "hidden",
                    border: "3px solid rgba(255,255,255,0.5)",
                    boxShadow:
                      "0 16px 56px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12)",
                    flexShrink: 0,
                    animation: "logoFloat 4.5s ease-in-out infinite",
                    position: "relative",
                  }}
                >
                  <img
                    src={restaurant.logo}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            )}

            <h1
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#fff",
                textAlign: "center",
                lineHeight: 1.1,
                marginBottom: restaurant.tagline ? 6 : 14,
                textShadow: "0 2px 20px rgba(0,0,0,0.45)",
                fontFamily: b?.display_font
                  ? `'${b.display_font}', serif`
                  : "var(--font-playfair, 'Playfair Display', serif)",
                letterSpacing: "-0.01em",
                animation:
                  "heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.22s both",
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
                  animation:
                    "heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.36s both",
                }}
              >
                {restaurant.tagline}
              </p>
            )}

            {infoItems.length > 0 && (
              <div
                style={{
                  animation:
                    "heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.48s both",
                }}
              >
                <InfoRotator
                  items={infoItems}
                  accent={accent}
                  textColor="rgba(255,255,255,0.88)"
                  maskColor="transparent"
                />
              </div>
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
            Cerrado por ahora. Podés explorar la carta igual.
          </div>
        )}

        {/* ── Sticky: Search + Categories ──────────────────────────────────────── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: BG,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: `0 1px 0 ${BORDER}`,
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
                gap: 6,
                padding: "6px 16px 10px",
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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 15px",
                      borderRadius: 999,
                      border: "none",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      background: isActive ? accent : SURFACE2,
                      color: isActive ? onAccent : TEXT2,
                      WebkitTapHighlightColor: "transparent",
                      letterSpacing: "-0.01em",
                      fontFamily: "var(--font-dm, var(--font-sans, inherit))",
                    }}
                  >
                    {cat.emoji && (
                      <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                    )}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Populares ────────────────────────────────────────────────────────── */}
        {!searchQuery &&
          (() => {
            const featured = restaurant.menu.categories
              .flatMap((c) => c.items)
              .filter(
                (item) =>
                  item.image &&
                  item.badge !== "Agotado" &&
                  (item.badge === "Popular" ||
                    item.badge === "Más pedido" ||
                    item.badge === "Nuevo"),
              )
              .slice(0, 8);

            if (featured.length < 2) return null;

            return (
              <div
                style={{
                  maxWidth: 640,
                  margin: "0 auto",
                  padding: "12px 0 0",
                }}
              >
                {/* header */}
                <div
                  style={{
                    padding: "0 16px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 14,
                      borderRadius: 2,
                      background: accent,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: TEXT2,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-dm, var(--font-sans, inherit))",
                    }}
                  >
                    Populares
                  </span>
                </div>

                {/* horizontal scroll */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    padding: "4px 16px 16px",
                    scrollbarWidth: "none" as const,
                  }}
                >
                  {featured.map((item) => {
                    const fQty = getQty(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          flexShrink: 0,
                          width: 130,
                          background: SURFACE,
                          borderRadius: 14,
                          border: `1.5px solid ${fQty > 0 ? accent + "30" : BORDER}`,
                          overflow: "hidden",
                          cursor: "pointer",
                          boxShadow:
                            fQty > 0
                              ? `0 3px 14px ${accent}22`
                              : "0 1px 4px rgba(0,0,0,0.07)",
                          transition: "box-shadow 0.2s",
                          WebkitTapHighlightColor: "transparent",
                        }}
                        onTouchStart={(e) => {
                          e.currentTarget.style.transform = "scale(0.97)";
                        }}
                        onTouchEnd={(e) => {
                          e.currentTarget.style.transform = "";
                        }}
                        onTouchCancel={(e) => {
                          e.currentTarget.style.transform = "";
                        }}
                      >
                        {/* mini image */}
                        <div
                          style={{
                            position: "relative",
                            height: 100,
                            overflow: "hidden",
                            background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
                          }}
                        >
                          <img
                            src={item.image!}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          {fQty > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                background: accent,
                                color: onAccent,
                                borderRadius: 999,
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {fQty}
                            </div>
                          )}
                        </div>

                        {/* mini text */}
                        <div style={{ padding: "8px 10px 10px" }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: TEXT1,
                              margin: "0 0 2px",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: accent,
                              margin: 0,
                            }}
                          >
                            {fmt(item.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                {searchResults.length !== 1 ? "s" : ""} para &ldquo;
                {searchQuery}
                &rdquo;
              </p>
              {searchResults.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 10,
                  }}
                >
                  {searchResults.map((item, idx) => (
                    <Fragment key={item.id}>
                      {ProductCard({
                        item,
                        catEmoji:
                          (item as typeof item & { _catEmoji: string })
                            ._catEmoji ?? "🍽️",
                        accent,
                        onAccent,
                        SURFACE,
                        SURFACE2,
                        BORDER,
                        TEXT1,
                        TEXT2,
                        idx,
                      })}
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 0",
                    color: TEXTM,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: SURFACE2,
                      margin: "0 auto 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Search size={24} strokeWidth={1.5} color={TEXTM} />
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
                    padding: "28px 4px 12px",
                    animation: "catHeaderIn 0.28s ease both",
                    animationDelay: `${catIndex * 0.06}s`,
                  }}
                >
                  {cat.emoji && (
                    <span
                      style={{
                        fontSize: 22,
                        lineHeight: 1,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
                      }}
                    >
                      {cat.emoji}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: TEXT1,
                      letterSpacing: "-0.02em",
                      fontFamily:
                        "var(--font-playfair, 'Playfair Display', serif)",
                    }}
                  >
                    {cat.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(to right, ${BORDER}, transparent)`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: TEXTM,
                      background: SURFACE2,
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontWeight: 600,
                    }}
                  >
                    {cat.items.length}
                  </span>
                </div>

                {cat.items.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    {cat.items.map((item, idx) => (
                      <Fragment key={item.id}>
                        {ProductCard({
                          item,
                          catEmoji: cat.emoji,
                          accent,
                          onAccent,
                          SURFACE,
                          SURFACE2,
                          BORDER,
                          TEXT1,
                          TEXT2,
                          idx,
                        })}
                      </Fragment>
                    ))}
                  </div>
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
                gap: 10,
                background: accent,
                color: onAccent,
                border: "none",
                borderRadius: 16,
                padding: "14px 18px",
                cursor: "pointer",
                boxShadow: `0 6px 28px ${accent}50`,
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
            {/* Icon + count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 10,
                padding: "5px 10px",
                flexShrink: 0,
              }}
            >
              <ShoppingCart
                size={16}
                strokeWidth={2}
                style={{
                  animation: cartBounce ? "badgePop 0.35s ease" : undefined,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {totalItems}
              </span>
            </div>
            {/* Label */}
            <span
              style={{
                flex: 1,
                textAlign: "center",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {totalItems === 1
                ? (cart[0]?.name?.split(" ").slice(0, 3).join(" ") ??
                  "Ver pedido")
                : `${totalItems} ítems`}
            </span>
            {/* Price */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 15 }}>
                {fmt(subtotal)}
              </span>
              {hasDelivery && (
                <span style={{ fontSize: 10, opacity: 0.7 }}>
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
                        {item.selectedExtra && (
                          <p
                            style={{ fontSize: 11, color: TEXTM, marginTop: 2 }}
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
                          {fmt(item.price + (item.selectedExtra?.price ?? 0))}{" "}
                          c/u
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
                  <span
                    style={{ fontWeight: 900, fontSize: 20, color: accent }}
                  >
                    {fmt(
                      subtotal + (hasDelivery ? restaurant.delivery_cost : 0),
                    )}
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
                    onTouchStart={(e) =>
                      (e.currentTarget.style.opacity = "0.88")
                    }
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
            const extraPrice = selectedExtraDraft?.price ?? 0;
            const totalPriceDisplay = selectedItem.price + extraPrice;
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
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px 0",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        background: BORDER,
                        margin: "0 auto",
                      }}
                    />
                    <button
                      onClick={() => setSelectedItem(null)}
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 16,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: SURFACE2,
                        border: `1px solid ${BORDER}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: TEXT2,
                        WebkitTapHighlightColor: "transparent",
                      }}
                      onTouchStart={(e) =>
                        (e.currentTarget.style.background = BORDER)
                      }
                      onTouchEnd={(e) =>
                        (e.currentTarget.style.background = SURFACE2)
                      }
                    >
                      <X size={15} strokeWidth={2.5} />
                    </button>
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
                    {selectedItem.extras && selectedItem.extras.length > 0 && (
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
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
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
                                selectedExtraDraft === null
                                  ? accent
                                  : "transparent",
                              color:
                                selectedExtraDraft === null ? onAccent : TEXT2,
                              borderColor:
                                selectedExtraDraft === null ? accent : BORDER,
                              transition: "all 0.15s",
                            }}
                          >
                            Simple
                          </button>
                          {selectedItem.extras.map((extra) => {
                            const isSelected =
                              selectedExtraDraft?.name === extra.name;
                            return (
                              <button
                                type="button"
                                key={extra.name}
                                onClick={() =>
                                  setSelectedExtraDraft(
                                    isSelected ? null : extra,
                                  )
                                }
                                style={{
                                  padding: "8px 18px",
                                  borderRadius: 999,
                                  border: "1.5px solid",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  background: isSelected
                                    ? accent
                                    : "transparent",
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
                            selectedExtraDraft ?? undefined,
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
                        onTouchEnd={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        Agregar al pedido →
                      </button>
                    ) : (
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 57.5 62.5"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <rect
                x="0"
                y="0"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="12.5"
                y="0"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="25"
                y="0"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="37.5"
                y="0"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="50"
                y="0"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="0"
                y="12.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="12.5"
                y="12.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="25"
                y="12.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="37.5"
                y="12.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="50"
                y="12.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="25"
                y="25"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="37.5"
                y="25"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="25"
                y="37.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="37.5"
                y="37.5"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="12.5"
                y="50"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="#FF6B35"
              />
              <rect
                x="25"
                y="50"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
              <rect
                x="37.5"
                y="50"
                width="10"
                height="10"
                rx="2"
                ry="2"
                fill="white"
              />
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1,
              }}
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
                Hecho con
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
                takef<span style={{ color: "#FF6B35" }}>yy</span>
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
            selectedExtra: i.selectedExtra,
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
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes logoPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.18); }
        }
        @keyframes heroOrb1 {
          0%, 100% { transform: translate(0px, 0px); }
          33%       { transform: translate(22px, -28px); }
          66%       { transform: translate(-14px, 18px); }
        }
        @keyframes heroOrb2 {
          0%, 100% { transform: translate(0px, 0px); }
          40%       { transform: translate(-26px, -14px); }
          70%       { transform: translate(18px, 26px); }
        }
        @keyframes glowOrbit {
          0%   { transform: translate(0%,   0%);   }
          20%  { transform: translate(40%,  -25%); }
          40%  { transform: translate(25%,  35%);  }
          60%  { transform: translate(-35%, 20%);  }
          80%  { transform: translate(-20%, -30%); }
          100% { transform: translate(0%,   0%);   }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `,
          }}
        />
      </div>
    </div>
  );
}
