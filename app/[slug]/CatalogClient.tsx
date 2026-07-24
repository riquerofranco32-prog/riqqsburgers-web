"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  Fragment,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Search,
  SearchX,
  ShoppingCart,
  Sparkles,
  XCircle,
  UtensilsCrossed,
  CheckCircle2,
  ShoppingBag,
  MessageCircle,
  ChevronRight,
  Share2,
  Heart,
  Zap,
  Clock,
  MapPin,
  Phone,
  AtSign,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type {
  Restaurant,
  MenuItem,
  RestaurantBrand,
} from "@/lib/getRestaurant";
import InfoRotator from "@/components/menu/InfoRotator";
import MenuBackground from "@/components/menu/MenuBackground";
import Badge from "@/components/menu/Badge";
import CartDrawer, {
  type CartItem,
  type SelectedExtra,
} from "@/components/menu/CartDrawer";
import CouponBanner from "@/components/menu/CouponBanner";
import AddedToast from "@/components/menu/AddedToast";
import ProductCard from "@/components/menu/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { trackEvent, trackGA4Event } from "@/lib/analytics";
import { createSupabaseBrowser } from "@/lib/supabase";
import {
  computeEffectiveOpen,
  getOpenStatus,
  formatOpenStatus,
} from "@/lib/businessHours";
import {
  fmt,
  vibrate,
  normalize,
  hexToLuma,
  hexToRgba,
  getCategoryIcon,
  type PublicCoupon,
} from "./catalogHelpers";

export type { PublicCoupon };

// Se montan on-demand (carrito, checkout, vista inmersiva, favoritos, detalle
// de producto). No hace falta que vayan en el bundle inicial ni en SSR.
const CheckoutModal = dynamic(() => import("@/components/CheckoutModal"), {
  ssr: false,
});
const MenuHeroShader = dynamic(
  () => import("@/components/menu/MenuHeroShader"),
  { ssr: false },
);
const FavoritesSheet = dynamic(
  () => import("@/components/menu/FavoritesSheet"),
  { ssr: false },
);
const ProductDetailSheet = dynamic(
  () => import("@/components/menu/ProductDetailSheet"),
  { ssr: false },
);
const ImmersiveView = dynamic(() => import("@/components/menu/ImmersiveView"), {
  ssr: false,
});

export default function CatalogClient({
  restaurant,
  coupons = [],
}: {
  restaurant: Restaurant;
  coupons?: PublicCoupon[];
}) {
  const CART_KEY = `cart_${restaurant.slug}`;
  const router = useRouter();
  const catBarRef = useRef<HTMLDivElement>(null);
  const catBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const catSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingToCat = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [catPillsAtEnd, setCatPillsAtEnd] = useState(false);
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
  const [shareCopied, setShareCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchForced, setSearchForced] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showExplorePill, setShowExplorePill] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const prevTotal = useRef(0);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [showImmersiveHint, setShowImmersiveHint] = useState(false);
  const [manualIsOpen, setManualIsOpen] = useState(restaurant.manual_is_open);
  // Recalcula cada minuto para reflejar el horario sin recargar la página
  // (la única forma en que cambia sin un evento de realtime del toggle manual).
  const [hoursTick, setHoursTick] = useState(0);
  useEffect(() => {
    if (!restaurant.business_hours) return;
    const id = setInterval(() => setHoursTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [restaurant.business_hours]);
  const isOpen = useMemo(
    () => computeEffectiveOpen(manualIsOpen, restaurant.business_hours),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualIsOpen, restaurant.business_hours, hoursTick],
  );
  const openStatus = useMemo(
    () =>
      restaurant.business_hours && manualIsOpen
        ? getOpenStatus(restaurant.business_hours)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualIsOpen, restaurant.business_hours, hoursTick],
  );
  const openStatusLabel = useMemo(() => {
    if (!manualIsOpen) return "Cerrado";
    if (!openStatus) return isOpen ? "Abierto" : "Cerrado";
    return formatOpenStatus(openStatus);
  }, [manualIsOpen, openStatus, isOpen]);
  const [pillIndicator, setPillIndicator] = useState({ left: 0, width: 0 });
  const [lastOrderPill, setLastOrderPill] = useState<{
    ref: string;
    tenantSlug: string;
  } | null>(null);

  // ── Shared product link (?producto=<id>) ──────────────────────────────────
  const searchParams = useSearchParams();
  useEffect(() => {
    const productId = searchParams.get("producto");
    if (!productId) return;
    const item = restaurant.menu.categories
      .flatMap((c) => c.items)
      .find((i) => i.id === productId);
    if (item) setSelectedItem(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar — el param no cambia en runtime

  // ── Favorites ─────────────────────────────────────────────────────────────
  const { favorites, isFavorite, toggleFavorite } = useFavorites(
    restaurant.slug,
  );

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
      trackGA4Event("add_to_cart", {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: 1,
      });
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
    (
      item: MenuItem,
      notes?: string,
      selectedExtra?: SelectedExtra,
      selectedAddons?: SelectedExtra[],
      removedIngredients?: string[],
      combinedWith?: { id: string; name: string },
    ) => {
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
                  selectedAddons: selectedAddons ?? i.selectedAddons,
                  removedIngredients:
                    removedIngredients ?? i.removedIngredients,
                  combinedWith: combinedWith ?? i.combinedWith,
                }
              : i,
          );
        return [
          ...prev,
          {
            ...item,
            quantity: 1,
            notes,
            selectedExtra,
            selectedAddons,
            removedIngredients,
            combinedWith,
          },
        ];
      });
      setAddedToast({ name: item.name, key: Date.now() });
    },
    [],
  );

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
  }, []);

  // ── Volver a pedir — reusa el historial guardado en el checkout ──────────
  interface HistoryItem {
    id: string;
    quantity: number;
    selectedExtra?: SelectedExtra;
    selectedAddons?: SelectedExtra[];
  }
  const [lastOrderItems, setLastOrderItems] = useState<HistoryItem[] | null>(
    null,
  );
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tak_history_${restaurant.slug}`);
      if (!raw) return;
      const history = JSON.parse(raw) as Array<{ items?: HistoryItem[] }>;
      const withItems = history.find((h) => h.items && h.items.length > 0);
      if (withItems?.items) setLastOrderItems(withItems.items);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reorderLastOrder = useCallback(() => {
    if (!lastOrderItems || lastOrderItems.length === 0) return;
    const allMenuItems = restaurant.menu.categories.flatMap((c) => c.items);
    const matched = lastOrderItems
      .map((hi) => ({
        menuItem: allMenuItems.find((i) => i.id === hi.id),
        hi,
      }))
      .filter(
        (m): m is { menuItem: MenuItem; hi: HistoryItem } => !!m.menuItem,
      );
    if (matched.length === 0) {
      setAddedToast({
        name: "esos productos ya no están disponibles",
        key: Date.now(),
      });
      return;
    }
    setCart((prev) => {
      const next = [...prev];
      for (const { menuItem, hi } of matched) {
        const idx = next.findIndex((i) => i.id === menuItem.id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + hi.quantity,
          };
        } else {
          next.push({
            ...menuItem,
            quantity: hi.quantity,
            selectedExtra: hi.selectedExtra,
            selectedAddons: hi.selectedAddons,
          });
        }
      }
      return next;
    });
    vibrate(45);
    setAddedToast({
      name:
        matched.length === lastOrderItems.length
          ? "tu pedido anterior"
          : `${matched.length} de ${lastOrderItems.length} productos de tu pedido anterior`,
      key: Date.now(),
    });
  }, [lastOrderItems, restaurant.menu.categories]);

  // ── Upsell — sugiere 1 producto que no está en el carrito ────────────────
  // ponytail: heurística simple (destacado, si no el más barato); no hace
  // falta un motor de recomendación para un catálogo de un solo restaurante.
  const upsellSuggestion = useMemo(() => {
    const cartIds = new Set(cart.map((i) => i.id));
    const candidates = restaurant.menu.categories
      .flatMap((c) => c.items)
      .filter((i) => !cartIds.has(i.id));
    if (candidates.length === 0) return null;
    const featured = candidates.find((i) => i.is_featured);
    const pick =
      featured ?? [...candidates].sort((a, b) => a.price - b.price)[0];
    return {
      id: pick.id,
      name: pick.name,
      price: pick.price,
      image: pick.image,
    };
  }, [cart, restaurant.menu.categories]);

  const addUpsell = useCallback(
    (id: string) => {
      const item = restaurant.menu.categories
        .flatMap((c) => c.items)
        .find((i) => i.id === id);
      if (item) addItem(item);
    },
    [restaurant.menu.categories, addItem],
  );

  const getQty = (id: string) => cart.find((i) => i.id === id)?.quantity ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce(
    (s, i) =>
      s +
      (i.price +
        (i.selectedExtra?.price ?? 0) +
        (i.selectedAddons?.reduce((sum, a) => sum + a.price, 0) ?? 0)) *
        i.quantity,
    0,
  );
  const hasDelivery = restaurant.delivery_cost > 0;

  // ── Scroll-triggered search bar ──────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => {
      setShowSearch(window.scrollY > 80);
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min((scrolled / max) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // ── is_open realtime — actualiza el badge sin recargar la página ─────────

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`tenant-open-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tenants",
          filter: `id=eq.${restaurant.id}`,
        },
        (payload) => {
          const updated = payload.new as { is_open?: boolean };
          if (typeof updated.is_open === "boolean") {
            setManualIsOpen(updated.is_open);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant.id]);

  // ── products realtime — refleja "agotado" / cambios sin recargar manual ──
  // ponytail: los productos no-disponibles ya vienen filtrados desde el server
  // (getRestaurant), así que la forma más simple y correcta de reflejar un
  // toggle en vivo es re-pedir los datos del server component (router.refresh),
  // en vez de duplicar la lógica de armado de `restaurant.menu` acá. El estado
  // de cliente (carrito, filtros) sobrevive porque CatalogClient no se remonta.
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`tenant-products-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `tenant_id=eq.${restaurant.id}`,
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => router.refresh(), 400);
        },
      )
      .subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [restaurant.id, router]);

  // ── Sliding category indicator ─────────────────────────────────────────────
  useEffect(() => {
    const btn = catBtnRefs.current[activeCategory];
    if (!btn) return;
    setPillIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [activeCategory]);

  // ── Last order tracking pill ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tak_last_order");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        ref: string;
        tenantSlug: string;
        createdAt: number;
      };
      if (data.tenantSlug !== restaurant.slug) return;
      if (Date.now() - data.createdAt > 2 * 60 * 60 * 1000) return;
      if (localStorage.getItem(`tak_last_order_dismissed_${data.ref}`)) return;
      setLastOrderPill({ ref: data.ref, tenantSlug: data.tenantSlug });
    } catch {}
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

  // ── Cat pills overflow check (hide arrow if no scroll needed) ──────────────

  useEffect(() => {
    const el = catBarRef.current;
    if (!el) return;
    const check = () => {
      setCatPillsAtEnd(el.scrollWidth <= el.clientWidth + 4);
    };
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [restaurant.menu.categories]);

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
    const locked = cartOpen || !!selectedItem || checkoutOpen || immersiveMode;
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
  }, [cartOpen, selectedItem, checkoutOpen, immersiveMode]);

  // ── ESC key + "/" to focus search ────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedItem) setSelectedItem(null);
        else if (cartOpen) setCartOpen(false);
      } else if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !cartOpen &&
        !selectedItem &&
        !checkoutOpen
      ) {
        const active = document.activeElement;
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        )
          return;
        e.preventDefault();
        setShowSearch(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cartOpen, selectedItem, checkoutOpen]);

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

  // ── Card reveal — IntersectionObserver stagger ───────────────────────────

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".card-reveal");
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    cards.forEach((card) => io.observe(card));
    return () => io.disconnect();
    // Re-run when cart changes (products re-render on qty change keys)
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

  // ── Share menu ───────────────────────────────────────────────────────────

  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: restaurant.name,
      text: `Mirá el menú de ${restaurant.name}`,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
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

  // ── All products flat for immersive mode ────────────────────────────────
  const allProducts = useMemo(
    () =>
      restaurant.menu.categories.flatMap((c) =>
        c.items
          .filter((i) => i.badge !== "Agotado")
          .map((i) => ({ ...i, catEmoji: c.emoji })),
      ),
    [restaurant.menu.categories],
  );

  // Hint de "Explorar" — una sola vez por navegador, la primera vez que hay
  // productos para mostrar en modo inmersivo.
  useEffect(() => {
    if (allProducts.length === 0) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("takefyy_immersive_hint_seen")) return;
    const t = setTimeout(() => setShowImmersiveHint(true), 1200);
    const hide = setTimeout(() => {
      setShowImmersiveHint(false);
      window.localStorage.setItem("takefyy_immersive_hint_seen", "1");
    }, 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, [allProducts.length]);

  // ── Flying cart animation ────────────────────────────────────────────────
  function flyToCart(imgSrc: string, emoji: string, sourceEl: HTMLElement) {
    if (typeof window === "undefined") return;
    const srcRect = sourceEl.getBoundingClientRect();
    const size = Math.min(srcRect.width, 74);

    const el = document.createElement("div");
    el.style.cssText = [
      `position:fixed`,
      `left:${srcRect.left + (srcRect.width - size) / 2}px`,
      `top:${srcRect.top}px`,
      `width:${size}px`,
      `height:${size}px`,
      `border-radius:12px`,
      `overflow:hidden`,
      `pointer-events:none`,
      `z-index:9999`,
      `will-change:transform,opacity`,
      `box-shadow:0 8px 32px rgba(0,0,0,0.35)`,
    ].join(";");

    if (imgSrc) {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      el.appendChild(img);
    } else {
      el.style.background = accent;
      el.style.fontSize = "28px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.textContent = emoji;
    }

    document.body.appendChild(el);

    // Target: cart pill if visible, else bottom-center (where pill will appear)
    const cartPill = document.querySelector<HTMLElement>("[data-cart-pill]");
    const tgtX = cartPill
      ? cartPill.getBoundingClientRect().left +
        cartPill.getBoundingClientRect().width / 2
      : window.innerWidth / 2;
    const tgtY = cartPill
      ? cartPill.getBoundingClientRect().top +
        cartPill.getBoundingClientRect().height / 2
      : window.innerHeight - 58;

    const srcCenterX = srcRect.left + srcRect.width / 2;
    const srcCenterY = srcRect.top + size / 2;
    const dx = tgtX - srcCenterX;
    const dy = tgtY - srcCenterY;

    const anim = el.animate(
      [
        {
          transform: "translate(0,0) scale(1)",
          opacity: 1,
          borderRadius: "12px",
        },
        {
          transform: `translate(${dx * 0.36}px, ${dy * 0.2 - 76}px) scale(0.68)`,
          opacity: 0.9,
          borderRadius: "20px",
          offset: 0.44,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.06)`,
          opacity: 0,
          borderRadius: "50%",
        },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        fill: "forwards",
      },
    );
    anim.onfinish = () => el.remove();
  }

  const infoItems = [
    restaurant.schedule && {
      icon: <Clock size={13} />,
      text: restaurant.schedule,
    },
    restaurant.address && {
      icon: <MapPin size={13} />,
      text: restaurant.address,
      href: `https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`,
    },
    restaurant.phone && {
      icon: <Phone size={13} />,
      text: restaurant.phone,
      href: `tel:${restaurant.phone.replace(/\s/g, "")}`,
    },
    restaurant.instagram && {
      icon: <AtSign size={13} />,
      text: `@${restaurant.instagram}`,
      href: `https://instagram.com/${restaurant.instagram}`,
    },
  ].filter(Boolean) as {
    icon: React.ReactNode;
    text: string;
    href?: string;
  }[];

  // All products flat for search
  const searchResults = restaurant.menu.categories
    .flatMap((c) =>
      c.items.map((item) => ({
        ...item,
        _catEmoji: c.emoji,
        _catName: c.name,
      })),
    )
    .filter((i) => {
      const q = normalize(searchQuery);
      return (
        normalize(i.name).includes(q) ||
        (i.description && normalize(i.description).includes(q))
      );
    });

  // ProductCard vive en components/menu/ProductCard.tsx (memo'd)
  // Helpers bound to this component instance, passed as props to ProductCard
  const handleOpen = useCallback(
    (item: MenuItem) => {
      setSelectedItem(item);
      void trackEvent(restaurant.id, "product_viewed", { product_id: item.id });
      trackGA4Event("view_item", {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
      });
    },
    [restaurant.id],
  );

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
      {/* Scroll progress bar */}
      {scrollProgress > 2 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: 2,
            width: `${scrollProgress}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
            zIndex: 9999,
            transition: "width 0.1s linear",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Back to top */}
      {scrollProgress > 25 &&
        !cartOpen &&
        !selectedItem &&
        !checkoutOpen &&
        !showSearch && (
          <button
            aria-label="Volver al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              position: "fixed",
              bottom: 88,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `${BG}e6`,
              border: `1px solid ${BORDER}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: TEXT2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 9990,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              transition: "opacity 0.2s, transform 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.color = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BORDER;
              e.currentTarget.style.color = TEXT2;
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 9 7 3 13 9" />
            </svg>
          </button>
        )}
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
              <Image
                src={restaurant.banner_url}
                alt=""
                fill
                priority
                sizes="100vw"
                style={{
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

          {/* Status badge + Share button */}
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Share button */}
            <button
              onClick={handleShare}
              aria-label="Compartir menú"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s",
                letterSpacing: "0.02em",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.55)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.35)")
              }
            >
              {shareCopied ? (
                <>
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Share2 size={11} strokeWidth={2.5} />
                  Compartir
                </>
              )}
            </button>

            {/* Open/closed badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: isOpen
                  ? "rgba(22,163,74,0.85)"
                  : "rgba(100,100,100,0.75)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                letterSpacing: "0.02em",
              }}
            >
              {isOpen ? (
                <CheckCircle2 size={11} strokeWidth={2.5} />
              ) : (
                <XCircle size={11} strokeWidth={2.5} />
              )}
              {openStatusLabel}
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
                  <Image
                    src={restaurant.logo}
                    alt=""
                    width={110}
                    height={110}
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
                fontSize: 36,
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

            {restaurant.rating && (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  textAlign: "center",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: "#facc15" }}>★</span>
                {restaurant.rating.avg.toFixed(1)} ({restaurant.rating.count})
              </p>
            )}

            {restaurant.tagline && (
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.88)",
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
        {!isOpen && (
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
            Cerrado por ahora.{" "}
            {openStatus?.kind === "closed" && openStatus.opensAt
              ? `Abre a las ${openStatus.opensAt}.`
              : "Podés explorar la carta igual."}
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
                    fontSize: 11,
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
                  const availableCount = cat.items.filter(
                    (i) => i.badge !== "Agotado",
                  ).length;
                  const allSoldOut = count > 0 && availableCount === 0;
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
                        opacity: allSoldOut ? 0.55 : 1,
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
                          {allSoldOut
                            ? "Agotado"
                            : `${availableCount} ${availableCount === 1 ? "producto" : "productos"}`}
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
              {/* Search — aparece al hacer scroll >80px o al activar botón */}
              <div
                style={{
                  overflow: "hidden",
                  maxHeight:
                    showSearch || searchForced || !!searchQuery ? 62 : 0,
                  opacity: showSearch || searchForced || !!searchQuery ? 1 : 0,
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
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchQuery("");
                          searchInputRef.current?.blur();
                        }
                      }}
                      placeholder={`Buscar en ${restaurant.name}...`}
                      className="search-input-glow"
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: `1.5px solid ${BORDER}`,
                        padding: "11px 36px 11px 36px",
                        background: hexToRgba(SURFACE, 0.9),
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        fontSize: 16,
                        color: TEXT1,
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = accent;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(accent, 0.15)}, 0 1px 4px rgba(0,0,0,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = BORDER;
                        e.currentTarget.style.boxShadow =
                          "0 1px 4px rgba(0,0,0,0.06)";
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchForced(false);
                          setShowExplorePill(true);
                          setTimeout(() => setShowExplorePill(false), 1500);
                        }}
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
                    {showExplorePill && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          marginTop: 6,
                          background: accent + "20",
                          color: accent,
                          border: `1px solid ${accent}40`,
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          pointerEvents: "none",
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          animation: "explorePill 1.5s ease both",
                        }}
                      >
                        Explorá el menú completo
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category pills — mobile only, desktop uses sidebar */}
              {!searchQuery && (
                <div
                  className="lg:hidden cat-pills-wrapper"
                  style={{ position: "relative" }}
                >
                  {/* Fade overlay — solo derecha; padding-left=20px resuelve el corte del primer pill */}
                  {!catPillsAtEnd && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 48,
                        pointerEvents: "none",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 8,
                        background: `linear-gradient(to left, ${BG}ee, transparent)`,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <ChevronRight
                        size={16}
                        style={{ color: accent, opacity: 0.7 }}
                      />
                    </div>
                  )}
                  <div
                    ref={catBarRef}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const atEnd =
                        el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
                      setCatPillsAtEnd(atEnd);
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: 6,
                      padding: "6px 20px 10px",
                      overflowX: "auto",
                      scrollbarWidth: "none" as const,
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {/* Sliding active indicator */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: pillIndicator.left,
                        width: pillIndicator.width,
                        height: 2,
                        background: accent,
                        borderRadius: 999,
                        transition:
                          "left 0.28s cubic-bezier(0.22,1,0.36,1), width 0.28s cubic-bezier(0.22,1,0.36,1)",
                        pointerEvents: "none",
                        opacity: pillIndicator.width > 0 ? 1 : 0,
                      }}
                    />
                    {restaurant.menu.categories.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          ref={(el) => {
                            catBtnRefs.current[cat.id] = el;
                          }}
                          onClick={() => {
                            scrollToCategory(cat.id);
                            catBtnRefs.current[cat.id]?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                              inline: "center",
                            });
                          }}
                          style={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            minHeight: 44,
                            borderRadius: 999,
                            border: isActive
                              ? `1px solid ${accent}35`
                              : `1px solid ${BORDER}`,
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: isActive ? `${accent}1a` : SURFACE2,
                            color: isActive ? accent : TEXT2,
                            WebkitTapHighlightColor: "transparent",
                            letterSpacing: "-0.01em",
                            fontFamily:
                              "var(--font-dm, var(--font-sans, inherit))",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = accent;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = BORDER;
                            }
                          }}
                        >
                          {cat.emoji && (
                            <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                          )}
                          {cat.name}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: isActive ? `${accent}cc` : `${TEXT2}80`,
                              lineHeight: 1,
                            }}
                          >
                            {
                              cat.items.filter((i) => i.badge !== "Agotado")
                                .length
                            }
                          </span>
                        </button>
                      );
                    })}
                    {/* Immersive mode trigger — pill con label + glow para que
                        se note (antes era un ícono gris más, casi invisible) */}
                    {allProducts.length > 0 && (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button
                          aria-label="Explorar menú en modo vista completa"
                          onClick={() => {
                            setImmersiveMode(true);
                            setShowImmersiveHint(false);
                            if (typeof window !== "undefined") {
                              window.localStorage.setItem(
                                "takefyy_immersive_hint_seen",
                                "1",
                              );
                            }
                          }}
                          style={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 36,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: `1px solid ${accent}40`,
                            background: `${accent}18`,
                            color: accent,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            WebkitTapHighlightColor: "transparent",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${accent}28`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${accent}18`;
                          }}
                        >
                          <Sparkles size={14} strokeWidth={2.5} />
                          Explorar
                        </button>
                        {showImmersiveHint && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              marginTop: 8,
                              background: accent,
                              color: onAccent,
                              borderRadius: 12,
                              padding: "6px 12px",
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                              zIndex: 10,
                              animation: "explorePill 1.5s ease both",
                              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                            }}
                          >
                            Nuevo: mirá el menú a pantalla completa 👆
                          </div>
                        )}
                      </div>
                    )}
                    {/* Search trigger — siempre visible en mobile */}
                    <button
                      aria-label="Buscar productos"
                      onClick={() => {
                        setSearchForced(true);
                        setTimeout(() => searchInputRef.current?.focus(), 50);
                      }}
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        height: 36,
                        borderRadius: 999,
                        border: `1px solid ${BORDER}`,
                        background: SURFACE2,
                        color: TEXT2,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                        transition: "background 0.15s, border-color 0.15s",
                        padding: "0 12px 0 10px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = accent;
                        e.currentTarget.style.background = `${accent}14`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER;
                        e.currentTarget.style.background = SURFACE2;
                      }}
                    >
                      <Search size={15} strokeWidth={2.5} />
                      <span
                        className="hidden lg:inline-block"
                        style={{
                          fontSize: 11,
                          color: `${TEXT2}80`,
                          fontWeight: 500,
                          lineHeight: 1,
                        }}
                      >
                        Buscar
                      </span>
                      <span
                        className="hidden lg:inline-flex"
                        style={{
                          fontSize: 10,
                          color: `${TEXT2}60`,
                          fontWeight: 600,
                          background: `${TEXT2}12`,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 4,
                          padding: "1px 4px",
                          lineHeight: 1.4,
                          fontFamily: "monospace",
                        }}
                      >
                        /
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── CUPONES ACTIVOS ─────────────────────────────────────────────────── */}
            {!searchQuery && coupons.length > 0 && (
              <CouponBanner
                coupons={coupons}
                accent={accent}
                text={TEXT1}
                text2={TEXT2}
                border={BORDER}
                surface={SURFACE}
              />
            )}

            {/* ── PROMO HERO — producto destacado único ────────────────────────────── */}
            {!searchQuery &&
              (() => {
                const promoProduct = restaurant.menu.categories
                  .flatMap((c) => c.items)
                  .filter((i) => i.is_featured && i.badge !== "Agotado")
                  .sort(
                    (a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0),
                  )[0];

                if (!promoProduct) return null;

                const promoQty = getQty(promoProduct.id);
                return (
                  <div
                    style={{
                      margin: "16px 12px 0",
                      borderRadius: 22,
                      overflow: "hidden",
                      position: "relative",
                      background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}06 100%)`,
                      border: `1.5px solid ${accent}35`,
                      boxShadow: `0 6px 32px ${accent}22, 0 1px 0 ${accent}15 inset`,
                    }}
                  >
                    {/* Badge PROMO — con icono y pulse */}
                    <div
                      className="promo-badge-pulse"
                      style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        zIndex: 3,
                        background: accent,
                        color: onAccent,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "5px 12px 5px 9px",
                        borderRadius: 999,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        boxShadow: `0 3px 12px ${accent}60`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Sparkles size={10} strokeWidth={2.5} />
                      Destacado
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                      }}
                    >
                      {/* Imagen grande */}
                      {promoProduct.image && (
                        <div
                          style={{
                            position: "relative",
                            height: 300,
                            overflow: "hidden",
                            cursor: "pointer",
                            background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
                          }}
                          onClick={() => setSelectedItem(promoProduct)}
                        >
                          <Image
                            src={promoProduct.image}
                            alt={promoProduct.name}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 992px"
                            style={{
                              objectFit: "cover",
                              objectPosition: "center 45%",
                              transition: "transform 0.4s ease",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.transform = "scale(1.03)";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.transform = "";
                            }}
                          />
                          {/* Gradient overlay bottom */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "50%",
                              background: `linear-gradient(to top, ${hexToRgba(BG, 0.9)} 0%, transparent 100%)`,
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      )}

                      {/* Contenido */}
                      <div
                        style={{
                          padding: "14px 16px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: TEXT1,
                                margin: 0,
                                lineHeight: 1.2,
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {promoProduct.name}
                            </p>
                            {promoProduct.description && (
                              <p
                                style={{
                                  fontSize: 13,
                                  color: TEXT2,
                                  margin: "6px 0 0",
                                  lineHeight: 1.45,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient:
                                    "vertical" as React.CSSProperties["WebkitBoxOrient"],
                                  overflow: "hidden",
                                }}
                              >
                                {promoProduct.description}
                              </p>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: accent,
                              flexShrink: 0,
                              fontVariantNumeric: "tabular-nums",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {promoProduct.extras &&
                            promoProduct.extras.length > 0
                              ? `desde ${fmt(promoProduct.price)}`
                              : fmt(promoProduct.price)}
                          </span>
                        </div>

                        {/* Botón / stepper */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            marginTop: 4,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {promoQty === 0 ? (
                            <button
                              aria-label={`Agregar ${promoProduct.name}`}
                              onClick={() => addItem(promoProduct)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 22px",
                                borderRadius: 999,
                                background: accent,
                                color: onAccent,
                                border: "none",
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: "pointer",
                                boxShadow: `0 4px 14px ${accent}44`,
                                transition:
                                  "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                                WebkitTapHighlightColor: "transparent",
                              }}
                              onMouseDown={(e) =>
                                (e.currentTarget.style.transform =
                                  "scale(0.95)")
                              }
                              onMouseUp={(e) =>
                                (e.currentTarget.style.transform = "")
                              }
                              onTouchStart={(e) =>
                                (e.currentTarget.style.transform =
                                  "scale(0.95)")
                              }
                              onTouchEnd={(e) =>
                                (e.currentTarget.style.transform = "")
                              }
                            >
                              <Plus size={16} />
                              Agregar al pedido
                            </button>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                background: SURFACE2,
                                borderRadius: 999,
                                padding: "4px 6px",
                                border: `1.5px solid ${accent}40`,
                              }}
                            >
                              <button
                                aria-label={`Quitar uno de ${promoProduct.name}`}
                                onClick={() => removeItem(promoProduct)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "transparent",
                                  border: "none",
                                  color: accent,
                                  fontSize: 20,
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
                                key={promoQty}
                                className="qty-pop"
                                style={{
                                  fontWeight: 800,
                                  fontSize: 16,
                                  minWidth: 20,
                                  textAlign: "center",
                                  color: TEXT1,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {promoQty}
                              </span>
                              <button
                                aria-label={`Agregar otro ${promoProduct.name}`}
                                onClick={() => addItem(promoProduct)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: accent,
                                  border: "none",
                                  color: onAccent,
                                  fontSize: 20,
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
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="160px"
                                  loading="lazy"
                                  style={{ objectFit: "cover" }}
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
                              <Image
                                src={item.image!}
                                alt={item.name}
                                fill
                                sizes="130px"
                                loading="lazy"
                                style={{ objectFit: "cover" }}
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
                    <div className="product-grid-vertical">
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
                            isFavorite={isFavorite(item.id)}
                            onToggleFavorite={toggleFavorite}
                            onAddFly={(it, el) =>
                              flyToCart(
                                it.image ?? "",
                                (item as typeof item & { _catEmoji: string })
                                  ._catEmoji ?? "🍽️",
                                el,
                              )
                            }
                            highlightQuery={searchQuery}
                          />
                        </Fragment>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "56px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <SearchX size={48} strokeWidth={1.5} color={TEXTM} />
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: TEXT1,
                          margin: 0,
                        }}
                      >
                        Sin resultados para &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: TEXT2,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Probá con otro término o revisá la ortografía
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchForced(false);
                        }}
                        style={{
                          marginTop: 8,
                          padding: "10px 22px",
                          borderRadius: 999,
                          background: accent,
                          color: onAccent,
                          border: "none",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        Limpiar búsqueda
                      </button>
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
                          {/* Category section header — mejorado */}
                          <div
                            id={`category-${cat.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "24px 0 12px",
                              animation: "catHeaderIn 0.28s ease both",
                              animationDelay: `${catIndex * 0.06}s`,
                            }}
                          >
                            <div
                              style={{ flex: 1, height: 1, background: BORDER }}
                            />
                            {/* Pill con icono + nombre + count */}
                            <div className="cat-section-pill">
                              {(() => {
                                const CatIcon = getCategoryIcon(cat.name);
                                return <CatIcon size={11} strokeWidth={2.5} />;
                              })()}
                              {cat.emoji
                                ? `${cat.emoji} ${cat.name}`
                                : cat.name}
                              {/* Count badge */}
                              {(() => {
                                const available = cat.items.filter(
                                  (i) => i.badge !== "Agotado",
                                ).length;
                                return available > 0 ? (
                                  <span
                                    style={{
                                      marginLeft: 2,
                                      background: hexToRgba(accent, 0.15),
                                      borderRadius: 999,
                                      padding: "1px 6px",
                                      fontSize: 9,
                                      fontWeight: 800,
                                      color: accent,
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    {available}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <div
                              style={{ flex: 1, height: 1, background: BORDER }}
                            />
                          </div>

                          {cat.items.length > 0 ? (
                            <div
                              className="product-grid-vertical"
                              style={{ marginBottom: 4 }}
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
                                    isFavorite={isFavorite(item.id)}
                                    onToggleFavorite={toggleFavorite}
                                    onAddFly={(it, el) =>
                                      flyToCart(it.image ?? "", cat.emoji, el)
                                    }
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
                    key={totalItems}
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
                      animation: cartBounce
                        ? "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)"
                        : undefined,
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
                      justifyContent: "flex-start",
                      padding: "48px 24px 24px",
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
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={44}
                                height={44}
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
                            {item.selectedAddons &&
                              item.selectedAddons.length > 0 && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: TEXTM,
                                    margin: "1px 0 0",
                                  }}
                                >
                                  +{" "}
                                  {item.selectedAddons
                                    .map((a) => a.name)
                                    .join(", ")}
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
                                  (item.selectedExtra?.price ?? 0) +
                                  (item.selectedAddons?.reduce(
                                    (sum, a) => sum + a.price,
                                    0,
                                  ) ?? 0)) *
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
                  {!isOpen ? (
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
                        Local cerrado ahora
                      </span>
                      {openStatus?.kind === "closed" && openStatus.opensAt ? (
                        <span
                          style={{
                            color: TEXT2,
                            fontWeight: 400,
                            fontSize: 12,
                          }}
                        >
                          Abre a las {openStatus.opensAt}
                        </span>
                      ) : restaurant.schedule ? (
                        <span
                          style={{
                            color: TEXT2,
                            fontWeight: 400,
                            fontSize: 12,
                          }}
                        >
                          {restaurant.schedule}
                        </span>
                      ) : null}
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
                        trackGA4Event("begin_checkout", {
                          value: subtotal,
                          items: totalItems,
                        });
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
        {/* ── Scroll to top ────────────────────────────────────────────────────── */}
        {showSearch && !cartOpen && !selectedItem && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Volver arriba"
            className="lg:hidden"
            style={{
              position: "fixed",
              bottom: totalItems > 0 ? 88 : 20,
              right: 16,
              zIndex: 48,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              transition: "bottom 0.2s, opacity 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 11V3M3 7l4-4 4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {/* ── Toast ────────────────────────────────────────────────────────────── */}
        <AddedToast
          visible={!!addedToast}
          name={addedToast?.name ?? ""}
          hasCart={totalItems > 0}
        />
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
                data-cart-pill=""
                onClick={() => {
                  vibrate(50);
                  setCartOpen(true);
                }}
                style={
                  {
                    position: "fixed",
                    bottom: `calc(16px + env(safe-area-inset-bottom, 0px))`,
                    left: "50%",
                    transform: cartBounce
                      ? "translateX(-50%) scale(1.04)"
                      : "translateX(-50%) translateY(0)",
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: accent,
                    color: onAccent,
                    border: "none",
                    borderRadius: 999,
                    padding: "14px 24px",
                    cursor: "pointer",
                    boxShadow: `0 4px 20px rgba(0,0,0,0.25), 0 2px 12px ${accent}55`,
                    WebkitTapHighlightColor: "transparent",
                    whiteSpace: "nowrap",
                    animation: cartBounce
                      ? undefined
                      : "cartEnter 0.3s cubic-bezier(0.22,1,0.36,1)",
                    transition:
                      "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s",
                  } as React.CSSProperties
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.28), 0 4px 16px ${accent}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.25), 0 2px 12px ${accent}55`;
                }}
              >
                {/* Cart icon */}
                <ShoppingCart size={16} strokeWidth={2} />
                {/* Label */}
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Ver pedido
                </span>
                {/* Badge cantidad */}
                <span
                  key={totalItems}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: 999,
                    minWidth: 24,
                    height: 24,
                    padding: "0 6px",
                    fontSize: 12,
                    fontWeight: 800,
                    animation: cartBounce
                      ? "badgePop 0.2s cubic-bezier(0.34,1.56,0.64,1)"
                      : undefined,
                  }}
                >
                  {totalItems}
                </span>
                {/* Precio */}
                <span style={{ fontWeight: 800, fontSize: 15 }}>
                  {fmt(subtotal)}
                </span>
              </button>
            </>
          )}
        </div>{" "}
        {/* end contents lg:hidden — cart bar */}
        {/* ── Cart drawer — mobile only ─────────────────────────────────────────── */}
        <CartDrawer
          open={cartOpen}
          cart={cart}
          totalItems={totalItems}
          subtotal={subtotal}
          hasDelivery={hasDelivery}
          deliveryCost={restaurant.delivery_cost}
          isOpen={isOpen}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          accent={accent}
          onAccent={onAccent}
          SURFACE={SURFACE}
          SURFACE2={SURFACE2}
          BORDER={BORDER}
          TEXT1={TEXT1}
          TEXT2={TEXT2}
          TEXTM={TEXTM}
          restaurantPhone={restaurant.phone}
          restaurantSchedule={restaurant.schedule}
          restaurantCategories={restaurant.menu.categories}
          onClose={() => setCartOpen(false)}
          onCheckout={() => {
            setCartOpen(false);
            setCheckoutOpen(true);
            void trackEvent(restaurant.id, "order_started");
            trackGA4Event("begin_checkout", {
              value: subtotal,
              items: totalItems,
            });
          }}
          onClearCart={() => setCart([])}
          onAdd={addItem}
          onRemove={removeItem}
          onRemoveAll={removeAll}
          onReorder={lastOrderItems ? reorderLastOrder : undefined}
          upsellSuggestion={upsellSuggestion}
          onAddUpsell={addUpsell}
        />
        {/* ── Product detail sheet ─────────────────────────────────────────────── */}
        {selectedItem &&
          (() => {
            const selectedCategory = restaurant.menu.categories.find((c) =>
              c.items.some((i) => i.id === selectedItem.id),
            );
            return (
              <ProductDetailSheet
                key={selectedItem.id}
                item={selectedItem}
                qty={getQty(selectedItem.id)}
                catEmoji={selectedCategory?.emoji ?? "🍽️"}
                categoryItems={selectedCategory?.items ?? []}
                allowHalf={selectedCategory?.allow_half ?? false}
                initialCombinedWith={
                  cart.find((i) => i.id === selectedItem.id)?.combinedWith
                }
                accent={accent}
                onAccent={onAccent}
                SURFACE={SURFACE}
                SURFACE2={SURFACE2}
                BORDER={BORDER}
                TEXT1={TEXT1}
                TEXT2={TEXT2}
                restaurantName={restaurant.name}
                restaurantId={restaurant.id}
                initialNotes={
                  cart.find((i) => i.id === selectedItem.id)?.notes ?? ""
                }
                initialExtra={
                  cart.find((i) => i.id === selectedItem.id)?.selectedExtra ??
                  null
                }
                initialAddons={
                  cart.find((i) => i.id === selectedItem.id)?.selectedAddons
                }
                initialRemovedIngredients={
                  cart.find((i) => i.id === selectedItem.id)?.removedIngredients
                }
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                onClose={() => setSelectedItem(null)}
                onOpen={(item) => {
                  setSelectedItem(item);
                  void trackEvent(restaurant.id, "product_viewed", {
                    product_id: item.id,
                  });
                }}
                addItem={addItem}
                removeItem={removeItem}
                addItemWithNotes={addItemWithNotes}
                updateNotes={updateNotes}
                onLightbox={setLightboxSrc}
              />
            );
          })()}
        {/* ── Powered by Takefyy (solo móvil — desktop usa sidebar) ──────────── */}
        {totalItems === 0 && (
          <div
            className="lg:hidden"
            style={{
              textAlign: "center",
              padding: "48px 20px 60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Empty cart illustration */}
            <div
              className="empty-cart-icon"
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: hexToRgba(accent, 0.08),
                border: `2px dashed ${hexToRgba(accent, 0.2)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <ShoppingCart size={32} color={hexToRgba(accent, 0.5)} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: TEXT1,
                  marginBottom: 4,
                }}
              >
                Tu carrito está vacío
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: TEXT2,
                  lineHeight: 1.5,
                  maxWidth: 220,
                  margin: "0 auto",
                }}
              >
                Explorá la carta y sumá lo que más te gusta
              </p>
            </div>
            <a
              href="/"
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
                marginTop: 4,
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
        {/* ── Last order tracking pill ─────────────────────────────────────────── */}
        {lastOrderPill && !cartOpen && !selectedItem && !checkoutOpen && (
          <div
            style={{
              position: "fixed",
              bottom: totalItems > 0 ? 80 : 20,
              left: 16,
              zIndex: 55,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              padding: "10px 14px 10px 12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              animation: "orderPillIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
              transition: "bottom 0.25s ease",
              maxWidth: "calc(100vw - 80px)",
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
              📦
            </span>
            <a
              href={`/pedido/${lastOrderPill.ref}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Pedido #{lastOrderPill.ref} — Seguirlo →
            </a>
            <button
              aria-label="Cerrar seguimiento de pedido"
              onClick={() => {
                try {
                  localStorage.setItem(
                    `tak_last_order_dismissed_${lastOrderPill.ref}`,
                    "1",
                  );
                } catch {}
                setLastOrderPill(null);
              }}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                fontSize: 11,
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              ×
            </button>
          </div>
        )}
        {/* ── Favorites floating button — visible only when there are favorites ── */}
        {favorites.length > 0 && !cartOpen && !selectedItem && (
          <button
            aria-label={`Ver favoritos (${favorites.length})`}
            onClick={() => setFavoritesOpen(true)}
            style={{
              position: "fixed",
              bottom:
                totalItems > 0
                  ? `max(88px, calc(env(safe-area-inset-bottom, 0px) + 88px))`
                  : `max(20px, env(safe-area-inset-bottom, 20px))`,
              right: 16,
              zIndex: 55,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: SURFACE,
              border: `1.5px solid ${BORDER}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
              WebkitTapHighlightColor: "transparent",
              transition:
                "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), bottom 0.25s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.88)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.88)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Heart size={18} fill="#EF4444" color="#EF4444" />
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#EF4444",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${SURFACE}`,
              }}
            >
              {favorites.length}
            </span>
          </button>
        )}
        {/* ── Favorites sheet ──────────────────────────────────────────────────── */}
        <FavoritesSheet
          open={favoritesOpen}
          onClose={() => setFavoritesOpen(false)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onAddToCart={(product) => {
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image ?? "",
              badge: null,
              description: "",
              extras: [],
              addons: [],
              option_groups: [],
              is_featured: false,
              featured_order: 0,
              ingredients: [],
            } as MenuItem);
            setFavoritesOpen(false);
          }}
          onAddAll={(products) => {
            products.forEach((product) => {
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image ?? "",
                badge: null,
                description: "",
                extras: [],
                addons: [],
                option_groups: [],
                is_featured: false,
                featured_order: 0,
                ingredients: [],
              } as MenuItem);
            });
          }}
          accent={accent}
          onAccent={onAccent}
          SURFACE={SURFACE}
          SURFACE2={SURFACE2}
          BORDER={BORDER}
          TEXT1={TEXT1}
          TEXT2={TEXT2}
          TEXTM={TEXTM}
        />
        {/* ── Immersive mode ───────────────────────────────────────────────────── */}
        {immersiveMode && (
          <ImmersiveView
            products={allProducts}
            accent={accent}
            onAccent={onAccent}
            SURFACE={SURFACE}
            TEXTM={TEXTM}
            onClose={() => setImmersiveMode(false)}
            onAdd={(item) => {
              addItem(item);
              setImmersiveMode(false);
            }}
            getQty={getQty}
            onOpenDetail={(item) => {
              setSelectedItem(item);
            }}
          />
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
            selectedAddons: i.selectedAddons,
          }))}
          onClearCart={() => setCart([])}
          orderNotes={orderNotes || undefined}
          tenant={{
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            whatsapp_number: restaurant.phone,
            delivery_cost: restaurant.delivery_cost,
            primary_color: restaurant.primary_color,
            min_order_amount: restaurant.min_order_amount,
            prep_time_minutes: restaurant.prep_time_minutes,
            delivery_mode: restaurant.delivery_mode ?? "none",
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            delivery_out_of_range_msg: restaurant.delivery_out_of_range_msg,
            deliveryZones: restaurant.deliveryZones ?? [],
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
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
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
        @keyframes orderPillIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
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
