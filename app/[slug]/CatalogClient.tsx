"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Fragment,
  memo,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Search,
  SearchX,
  ShoppingCart,
  Flame,
  Sparkles,
  Tag,
  XCircle,
  Star,
  UtensilsCrossed,
  CheckCircle2,
  Beef,
  Pizza,
  Coffee,
  Cake,
  Sandwich,
  Salad,
  ShoppingBag,
  MessageCircle,
  ChevronRight,
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
import { trackEvent } from "@/lib/analytics";

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

function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function getCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("burger") || n.includes("hambur")) return Beef;
  if (n.includes("pizza")) return Pizza;
  if (
    n.includes("bebida") ||
    n.includes("café") ||
    n.includes("cafe") ||
    n.includes("tomar")
  )
    return Coffee;
  if (
    n.includes("postre") ||
    n.includes("torta") ||
    n.includes("dulce") ||
    n.includes("helado")
  )
    return Cake;
  if (
    n.includes("sandwich") ||
    n.includes("sándwich") ||
    n.includes("pancho") ||
    n.includes("wrap")
  )
    return Sandwich;
  if (n.includes("ensalada") || n.includes("vegano") || n.includes("verde"))
    return Salad;
  return UtensilsCrossed;
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
}) {
  const soldOut = item.badge === "Agotado";
  return (
    <div
      style={{
        animation: `cardFadeIn 0.32s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${Math.min((idx ?? 0) * 0.04, 0.3)}s`,
      }}
    >
      <div
        onClick={() => !soldOut && onOpen(item)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 14px",
          background: hexToRgba(SURFACE, 0.8),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 16,
          border: `1px solid ${qty > 0 ? accent + "30" : BORDER}`,
          cursor: soldOut ? "default" : "pointer",
          opacity: soldOut ? 0.6 : 1,
          boxShadow:
            qty > 0 ? `0 3px 16px ${accent}22` : "0 1px 6px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.2s, border-color 0.2s",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
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
        {/* Left: text + price + stepper */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
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
                margin: "0 0 8px",
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
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 15, color: accent }}>
              {fmt(item.price)}
            </span>
            {!soldOut && (
              <div onClick={(e) => e.stopPropagation()}>
                {qty === 0 ? (
                  <button
                    aria-label={`Agregar ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: accent,
                      color: onAccent,
                      border: "none",
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
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
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
                      className="qty-flip"
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        minWidth: 14,
                        textAlign: "center",
                        color: TEXT1,
                        display: "block",
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      aria-label={`Agregar otro ${item.name}`}
                      onClick={() => onAdd(item)}
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
        </div>
        {/* Right: image 88×88 con skeleton */}
        <div
          className="img-skeleton"
          style={{
            flexShrink: 0,
            width: 88,
            height: 88,
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onLoad={(e) => {
                // remove skeleton shimmer once loaded
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
                background: `linear-gradient(135deg, ${accent}16, ${accent}06)`,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: accent + "50",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {soldOut && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>
                Agotado
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

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
  const [showSearch, setShowSearch] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [sheetImageLoaded, setSheetImageLoaded] = useState(false);
  const prevTotal = useRef(0);

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const addItem = useCallback(
    (item: MenuItem) => {
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
      void trackEvent(restaurant.id, "add_to_cart", { product_id: item.id });
    },
    [restaurant.id],
  );

  const removeItem = useCallback(
    (item: MenuItem) => {
      vibrate(25);
      setCart((prev) => {
        const found = prev.find((i) => i.id === item.id);
        if (!found) return prev;
        if (found.quantity === 1) return prev.filter((i) => i.id !== item.id);
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
        );
      });
      void trackEvent(restaurant.id, "remove_from_cart", {
        product_id: item.id,
      });
    },
    [restaurant.id],
  );

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

  // ── Scroll-triggered search bar ──────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setShowSearch(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Sync notes draft when selected item changes ───────────────────────────

  useEffect(() => {
    if (!selectedItem) return;
    const existing = cart.find((i) => i.id === selectedItem.id);
    setItemNotesDraft(existing?.notes ?? "");
    setSelectedExtraDraft(existing?.selectedExtra ?? null);
    setSheetImageLoaded(false);
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

  // ── Analytics — menu_view on mount ───────────────────────────────────────

  useEffect(() => {
    void trackEvent(restaurant.id, "menu_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Analytics — search (debounced 500ms) ─────────────────────────────────

  useEffect(() => {
    if (!searchQuery) return;
    const t = setTimeout(() => {
      void trackEvent(restaurant.id, "search", {
        metadata: { query: searchQuery },
      });
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, restaurant.id]);

  // ── Scroll restoration ───────────────────────────────────────────────────

  useEffect(() => {
    const key = `scroll_${restaurant.slug}`;
    const saved = sessionStorage.getItem(key);
    if (saved) window.scrollTo(0, parseInt(saved));
    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Swipe to dismiss (cart drawer) — con drag en tiempo real ────────────

  const swipeStart = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [drawerDragOffset, setDrawerDragOffset] = useState(0);

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

  // ProductCard is defined outside as a memo'd component — see top of file
  // Helpers bound to this component instance, passed as props to ProductCard
  const handleOpen = useCallback(
    (item: MenuItem) => {
      setSelectedItem(item);
      void trackEvent(restaurant.id, "product_viewed", { product_id: item.id });
    },
    [restaurant.id],
  );

  // (old ProductCard body removed — component is now above CatalogClient — see memo)

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
      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "clamp(260px, 35vw, 420px)",
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
            {/* Logo flotante — con fallback de iniciales si no hay imagen */}
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
                  background: restaurant.logo ? undefined : accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {restaurant.logo ? (
                  <img
                    src={restaurant.logo}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      color: onAccent,
                      lineHeight: 1,
                      userSelect: "none",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {restaurant.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

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

          {/* Blur fade at bottom of hero — blends into page background */}
          <div
            style={{
              position: "absolute",
              inset: "auto 0 0 0",
              height: 64,
              background: `linear-gradient(to bottom, transparent, ${BG})`,
              pointerEvents: "none",
              zIndex: 6,
            }}
          />
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
        {/* ── Desktop 3-column layout ── */}
        <div className="lg:flex w-full min-h-screen">
          {/* Desktop category sidebar */}
          <aside
            className="hidden lg:flex lg:flex-col"
            style={{
              width: 256,
              flexShrink: 0,
              borderRight: `1px solid ${BORDER}`,
            }}
          >
            <div
              className="sticky overflow-y-auto"
              style={{
                top: 0,
                maxHeight: "100vh",
                scrollbarWidth: "none" as const,
              }}
            >
              <div style={{ padding: "20px 12px" }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.12em",
                    color: TEXTM,
                    padding: "0 12px",
                    marginBottom: 12,
                  }}
                >
                  Categorías
                </p>
                {restaurant.menu.categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const Icon = getCategoryIcon(cat.name);
                  const count = cat.items.length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "none",
                        background: isActive ? `${accent}14` : "transparent",
                        borderLeft: `3px solid ${isActive ? accent : "transparent"}`,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        marginBottom: 2,
                        transition: "all 0.15s ease",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: isActive ? accent : SURFACE2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon size={14} color={isActive ? onAccent : TEXTM} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isActive ? accent : TEXT1,
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cat.emoji ? `${cat.emoji} ${cat.name}` : cat.name}
                        </p>
                        <p style={{ fontSize: 11, color: TEXTM, margin: 0 }}>
                          {count} {count === 1 ? "producto" : "productos"}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight
                          size={13}
                          style={{ color: accent, flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Center column: search + categories + products */}
          <main
            className="flex-1 min-w-0"
            style={{ borderLeft: `1px solid ${BORDER}` }}
          >
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
              {/* Search — aparece al hacer scroll >80px */}
              <div
                style={{
                  overflow: "hidden",
                  maxHeight: showSearch || !!searchQuery ? 62 : 0,
                  opacity: showSearch || !!searchQuery ? 1 : 0,
                  transition:
                    "max-height 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease",
                }}
              >
                <div style={{ padding: "10px 16px 6px" }}>
                  <div
                    style={{
                      maxWidth: 640,
                      margin: "0 auto",
                      position: "relative",
                    }}
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
                      placeholder={`Buscar en ${restaurant.name}...`}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: `1.5px solid ${BORDER}`,
                        padding: "11px 36px 11px 36px",
                        background: hexToRgba(SURFACE, 0.9),
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        fontSize: 14,
                        color: TEXT1,
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = accent)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = BORDER)
                      }
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
              </div>

              {/* Category pills — mobile only, desktop uses sidebar */}
              {!searchQuery && (
                <div
                  ref={catBarRef}
                  className="lg:hidden"
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
                          gap: 6,
                          padding: "8px 16px",
                          minHeight: 40,
                          borderRadius: 999,
                          border: "none",
                          fontWeight: isActive ? 600 : 500,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          background: isActive ? accent : SURFACE2,
                          color: isActive ? onAccent : TEXT2,
                          WebkitTapHighlightColor: "transparent",
                          letterSpacing: "-0.01em",
                          fontFamily:
                            "var(--font-dm, var(--font-sans, inherit))",
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

            {/* ── Lo más pedido / Populares ────────────────────────────────────────── */}
            {!searchQuery &&
              (() => {
                const featuredItems = restaurant.menu.categories
                  .flatMap((c) => c.items)
                  .filter((i) => i.is_featured && i.badge !== "Agotado")
                  .sort(
                    (a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0),
                  )
                  .slice(0, 8);

                const badgeItems =
                  featuredItems.length === 0
                    ? restaurant.menu.categories
                        .flatMap((c) => c.items)
                        .filter(
                          (i) =>
                            i.image &&
                            i.badge !== "Agotado" &&
                            (i.badge === "Popular" ||
                              i.badge === "Más pedido" ||
                              i.badge === "Nuevo"),
                        )
                        .slice(0, 8)
                    : [];

                const isFeaturedMode = featuredItems.length >= 1;
                const showItems = isFeaturedMode ? featuredItems : badgeItems;

                if (showItems.length < (isFeaturedMode ? 1 : 2)) return null;

                return (
                  <div
                    style={{
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
                      {isFeaturedMode ? (
                        <Sparkles
                          size={13}
                          style={{ color: accent, flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 3,
                            height: 14,
                            borderRadius: 2,
                            background: accent,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: TEXT2,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.08em",
                          fontFamily:
                            "var(--font-dm, var(--font-sans, inherit))",
                        }}
                      >
                        {isFeaturedMode ? "Lo más pedido" : "Populares"}
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
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {showItems.map((item) => {
                        const fQty = getQty(item.id);
                        if (isFeaturedMode) {
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              style={{
                                flexShrink: 0,
                                width: 160,
                                height: 200,
                                scrollSnapAlign: "start",
                                borderRadius: 16,
                                overflow: "hidden",
                                cursor: "pointer",
                                position: "relative",
                                boxShadow:
                                  fQty > 0
                                    ? `0 4px 20px ${accent}44`
                                    : "0 2px 12px rgba(0,0,0,0.12)",
                                border:
                                  fQty > 0
                                    ? `2px solid ${accent}50`
                                    : "2px solid transparent",
                                transition:
                                  "box-shadow 0.2s, border-color 0.2s",
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
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
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
                                    background: `linear-gradient(135deg, ${accent}40, ${accent}20)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 56,
                                    fontWeight: 900,
                                    color: accent,
                                  }}
                                >
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {/* gradient overlay bottom */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: "60%",
                                  background:
                                    "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
                                  pointerEvents: "none",
                                }}
                              />
                              {/* price badge top-right */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  background: accent,
                                  color: onAccent,
                                  padding: "3px 9px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                }}
                              >
                                {fmt(item.price)}
                              </div>
                              {/* qty badge top-left */}
                              {fQty > 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    background: "#fff",
                                    color: accent,
                                    borderRadius: 999,
                                    width: 22,
                                    height: 22,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  {fQty}
                                </div>
                              )}
                              {/* name + badge at bottom */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: "10px 12px 12px",
                                  pointerEvents: "none",
                                }}
                              >
                                {item.badge && item.badge !== "Agotado" && (
                                  <div style={{ marginBottom: 4 }}>
                                    <Badge badge={item.badge} />
                                  </div>
                                )}
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#fff",
                                    margin: 0,
                                    lineHeight: 1.3,
                                    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.name}
                                </p>
                              </div>
                              {/* Quick add button */}
                              <button
                                aria-label={`Agregar ${item.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem(item);
                                }}
                                style={{
                                  position: "absolute",
                                  bottom: 10,
                                  right: 10,
                                  width: 30,
                                  height: 30,
                                  borderRadius: "50%",
                                  background: "rgba(255,255,255,0.95)",
                                  border: "none",
                                  color: accent,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                                  pointerEvents: "all",
                                  zIndex: 2,
                                  fontSize: 20,
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  WebkitTapHighlightColor: "transparent",
                                }}
                              >
                                +
                              </button>
                            </div>
                          );
                        }
                        // badge-based small cards (fallback)
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            style={{
                              flexShrink: 0,
                              width: 130,
                              scrollSnapAlign: "start",
                              background: hexToRgba(SURFACE, 0.82),
                              backdropFilter: "blur(12px)",
                              WebkitBackdropFilter: "blur(12px)",
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
            <div style={{ padding: "8px 12px 120px" }}>
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
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {searchResults.map((item, idx) => (
                        <Fragment key={item.id}>
                          <ProductCard
                            item={item}
                            catEmoji={
                              (item as typeof item & { _catEmoji: string })
                                ._catEmoji ?? "🍽️"
                            }
                            qty={getQty(item.id)}
                            accent={accent}
                            onAccent={onAccent}
                            SURFACE={SURFACE}
                            SURFACE2={SURFACE2}
                            BORDER={BORDER}
                            TEXT1={TEXT1}
                            TEXT2={TEXT2}
                            idx={idx}
                            onOpen={handleOpen}
                            onAdd={addItem}
                            onRemove={removeItem}
                          />
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
                        <SearchX size={24} strokeWidth={1.5} color={TEXTM} />
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
                        No encontramos &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  )}
                </>
              ) : (
                (() => {
                  const allEmpty = restaurant.menu.categories.every(
                    (c) => c.items.length === 0,
                  );
                  if (allEmpty) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "80px 24px",
                          textAlign: "center",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 20,
                            background: hexToRgba(SURFACE, 0.8),
                            border: `1px solid ${BORDER}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <UtensilsCrossed
                            size={32}
                            strokeWidth={1.5}
                            color={TEXTM}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              color: TEXT1,
                              marginBottom: 6,
                            }}
                          >
                            Carta en preparación
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: TEXT2,
                              lineHeight: 1.5,
                            }}
                          >
                            Estamos cargando los productos.
                            <br />
                            Volvé pronto o contactanos.
                          </p>
                        </div>
                        {restaurant.phone && (
                          <a
                            href={`https://wa.me/${restaurant.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${restaurant.name}! Quiero saber qué tienen disponible.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 22px",
                              borderRadius: 14,
                              background: "#25D366",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 14,
                              textDecoration: "none",
                              boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
                            }}
                          >
                            Consultar por WhatsApp
                          </a>
                        )}
                      </div>
                    );
                  }
                  return (
                    <>
                      {/* ── All categories (scroll-based) ── */}
                      {restaurant.menu.categories.map((cat, catIndex) => (
                        <div
                          key={cat.id}
                          ref={(el) => {
                            catSectionRefs.current[cat.id] = el;
                          }}
                        >
                          {/* Category section header */}
                          <div
                            id={`category-${cat.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "24px 0 10px",
                              animation: "catHeaderIn 0.28s ease both",
                              animationDelay: `${catIndex * 0.06}s`,
                            }}
                          >
                            <div
                              style={{ flex: 1, height: 1, background: BORDER }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: accent,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase" as const,
                                padding: "0 4px",
                                fontFamily:
                                  "var(--font-dm, var(--font-sans, inherit))",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cat.emoji
                                ? `${cat.emoji} ${cat.name}`
                                : cat.name}
                            </span>
                            <div
                              style={{ flex: 1, height: 1, background: BORDER }}
                            />
                          </div>

                          {cat.items.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              {cat.items.map((item, idx) => (
                                <Fragment key={item.id}>
                                  <ProductCard
                                    item={item}
                                    catEmoji={cat.emoji}
                                    qty={getQty(item.id)}
                                    accent={accent}
                                    onAccent={onAccent}
                                    SURFACE={SURFACE}
                                    SURFACE2={SURFACE2}
                                    BORDER={BORDER}
                                    TEXT1={TEXT1}
                                    TEXT2={TEXT2}
                                    idx={idx}
                                    onOpen={handleOpen}
                                    onAdd={addItem}
                                    onRemove={removeItem}
                                  />
                                </Fragment>
                              ))}
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "40px 0",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 16,
                                  background: hexToRgba(SURFACE, 0.8),
                                  border: `1px solid ${BORDER}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <UtensilsCrossed
                                  size={22}
                                  strokeWidth={1.5}
                                  color={TEXTM}
                                />
                              </div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: TEXT2,
                                }}
                              >
                                Sin productos
                              </p>
                              <p style={{ fontSize: 12, color: TEXTM }}>
                                Esta sección no tiene productos disponibles
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  );
                })()
              )}
            </div>
          </main>

          {/* Desktop cart panel */}
          <aside
            className="hidden lg:flex lg:flex-col"
            style={{
              width: 320,
              flexShrink: 0,
              borderLeft: `1px solid ${BORDER}`,
              background: SURFACE,
            }}
          >
            <div
              className="sticky"
              style={{
                top: 0,
                height: "100vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: "20px",
                  borderBottom: `1px solid ${BORDER}`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingBag size={18} style={{ color: accent }} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: TEXT1 }}>
                    Tu pedido
                  </span>
                </div>
                {totalItems > 0 && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: accent,
                      color: onAccent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {totalItems}
                  </div>
                )}
              </div>

              {/* Items list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {cart.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      padding: "24px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: SURFACE2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <ShoppingBag size={24} style={{ color: TEXTM }} />
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: TEXT2,
                        marginBottom: 4,
                      }}
                    >
                      Tu carrito está vacío
                    </p>
                    <p style={{ fontSize: 12, color: TEXTM }}>
                      Agregá productos del menú para comenzar
                    </p>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {cart.map((item) => {
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
                              fontSize: 18,
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
                                margin: 0,
                              }}
                            >
                              {item.name}
                            </p>
                            {item.selectedExtra && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: TEXTM,
                                  margin: "1px 0 0",
                                }}
                              >
                                {item.selectedExtra.name} (+
                                {fmt(item.selectedExtra.price)})
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: accent,
                                margin: "2px 0 0",
                              }}
                            >
                              {fmt(
                                (item.price +
                                  (item.selectedExtra?.price ?? 0)) *
                                  item.quantity,
                              )}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
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
                                width: 28,
                                height: 28,
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
                                <Trash2 size={10} />
                              ) : (
                                <Minus size={10} />
                              )}
                            </button>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                minWidth: 16,
                                textAlign: "center",
                                color: TEXT1,
                              }}
                            >
                              {item.quantity}
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
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer: totals + CTA */}
              {cart.length > 0 && (
                <div
                  style={{
                    padding: "16px",
                    borderTop: `1px solid ${BORDER}`,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, color: TEXTM }}>Subtotal</span>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: TEXT2 }}
                    >
                      {fmt(subtotal)}
                    </span>
                  </div>
                  {hasDelivery && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
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
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{ fontWeight: 700, fontSize: 16, color: TEXT1 }}
                    >
                      Total
                    </span>
                    <span
                      style={{ fontWeight: 800, fontSize: 18, color: accent }}
                    >
                      {fmt(
                        subtotal + (hasDelivery ? restaurant.delivery_cost : 0),
                      )}
                    </span>
                  </div>
                  {!restaurant.is_open ? (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: 12,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#f87171",
                        fontSize: 13,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>
                        🚫 Local cerrado ahora
                      </span>
                      {restaurant.schedule && (
                        <span
                          style={{
                            color: TEXT2,
                            fontWeight: 400,
                            fontSize: 12,
                          }}
                        >
                          {restaurant.schedule}
                        </span>
                      )}
                      {restaurant.phone && (
                        <a
                          href={`https://wa.me/${restaurant.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola! ¿A qué hora abren hoy?")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginTop: 4,
                            display: "inline-block",
                            color: "#25d366",
                            fontWeight: 600,
                            fontSize: 12,
                            textDecoration: "none",
                          }}
                        >
                          Preguntar horario por WhatsApp →
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutOpen(true);
                        void trackEvent(restaurant.id, "order_started");
                      }}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: 14,
                        background: accent,
                        color: onAccent,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        WebkitTapHighlightColor: "transparent",
                        boxShadow: `0 6px 20px ${accent}40`,
                      }}
                    >
                      <MessageCircle size={16} />
                      Pedir por WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>{" "}
        {/* end lg:flex */}
        {/* ── Toast ────────────────────────────────────────────────────────────── */}
        <AddedToast visible={!!addedToast} name={addedToast?.name ?? ""} />
        {/* ── Cart bar — mobile only ────────────────────────────────────────────── */}
        <div className="contents lg:hidden">
          {totalItems > 0 && !selectedItem && !cartOpen && (
            <>
              {/* Gradient fade behind cart bar */}
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 110,
                  background: `linear-gradient(to top, ${BG} 40%, transparent)`,
                  zIndex: 58,
                  pointerEvents: "none",
                }}
              />
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
            </>
          )}
        </div>{" "}
        {/* end contents lg:hidden — cart bar */}
        {/* ── Cart drawer — mobile only ─────────────────────────────────────────── */}
        <div className="contents lg:hidden">
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <ShoppingCart size={18} style={{ color: accent }} />
                    <span
                      style={{ fontWeight: 800, fontSize: 17, color: TEXT1 }}
                    >
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
                    <span
                      style={{ fontSize: 13, color: TEXT2, fontWeight: 600 }}
                    >
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
                    <span
                      style={{ fontWeight: 800, fontSize: 18, color: TEXT1 }}
                    >
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
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700 }}>
                        🚫 Local cerrado ahora
                      </span>
                      {restaurant.schedule && (
                        <span
                          style={{
                            color: TEXT2,
                            fontWeight: 400,
                            fontSize: 13,
                          }}
                        >
                          {restaurant.schedule}
                        </span>
                      )}
                      {restaurant.phone && (
                        <a
                          href={`https://wa.me/${restaurant.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola! ¿A qué hora abren hoy?")}`}
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
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutOpen(true);
                        void trackEvent(restaurant.id, "order_started");
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
        </div>{" "}
        {/* end contents lg:hidden — cart drawer */}
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
                  role="dialog"
                  aria-modal="true"
                  aria-label={selectedItem?.name}
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
                      aspectRatio: "16 / 9",
                      maxHeight: 280,
                      overflow: "hidden",
                      marginTop: 10,
                      cursor: selectedItem.image ? "zoom-in" : "default",
                    }}
                    onClick={() =>
                      selectedItem.image && setLightboxSrc(selectedItem.image)
                    }
                  >
                    {selectedItem.image ? (
                      <img
                        src={selectedItem.image}
                        alt={selectedItem.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transform: sheetImageLoaded
                            ? "scale(1)"
                            : "scale(1.04)",
                          transition: "transform 0.5s ease",
                        }}
                        onLoad={() => setSheetImageLoaded(true)}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
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

                    {/* Bottom gradient so text below reads cleanly */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "40%",
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.25), transparent)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Close button overlaid on image */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(null);
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.40)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        WebkitTapHighlightColor: "transparent",
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
          <div
            style={{
              textAlign: "center",
              padding: "32px 0 48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <a
              href="https://takefyy.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent + "60";
                e.currentTarget.style.boxShadow = `0 2px 12px ${accent}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
              }}
            >
              <span style={{ fontSize: 11, color: TEXTM, fontWeight: 500 }}>
                Menú digital por
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: "-0.02em",
                }}
              >
                Takefyy
              </span>
            </a>
          </div>
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
        @keyframes lightboxEnter {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `,
          }}
        />
        {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
        {lightboxSrc &&
          createPortal(
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "rgba(0,0,0,0.96)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setLightboxSrc(null)}
            >
              <img
                src={lightboxSrc}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  padding: 20,
                  animation: "lightboxEnter 0.22s ease forwards",
                }}
              />
              <button
                onClick={() => setLightboxSrc(null)}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
