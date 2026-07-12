"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  ClipboardList,
  Users,
  Package,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface PaletteItem extends NavItem {
  isAction?: boolean;
  isDynamic?: boolean;
  groupLabel?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 5;

export function CommandPalette({
  navItems,
  actionItems = [],
  slug,
  tenantId,
}: {
  navItems: NavItem[];
  actionItems?: NavItem[];
  slug: string;
  tenantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dynamicResults, setDynamicResults] = useState<PaletteItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allItems = useMemo<PaletteItem[]>(
    () => [
      ...actionItems.map((item) => ({ ...item, isAction: true })),
      ...navItems,
    ],
    [navItems, actionItems],
  );

  const staticResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [allItems, query]);

  // Búsqueda de contenido real (pedidos, clientes, productos) con debounce
  // para no pegarle a Supabase en cada tecla.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setDynamicResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowser();
      const like = `%${q}%`;

      const [ordersRes, customersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("order_ref, customer_name, total")
          .eq("tenant_id", tenantId)
          .ilike("order_ref", like)
          .limit(RESULT_LIMIT),
        supabase
          .from("orders")
          .select("customer_name, customer_phone")
          .eq("tenant_id", tenantId)
          .or(`customer_name.ilike.${like},customer_phone.ilike.${like}`)
          .limit(20),
        supabase
          .from("products")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .ilike("name", like)
          .limit(RESULT_LIMIT),
      ]);

      const orderItems: PaletteItem[] = (ordersRes.data ?? []).map((o) => ({
        href: `/pedidos/${o.order_ref}`,
        label: `#${o.order_ref}${o.customer_name ? " — " + o.customer_name : ""}`,
        icon: ClipboardList,
        isDynamic: true,
        groupLabel: "Pedidos",
      }));

      // Dedupe clientes por teléfono (o nombre si no hay teléfono)
      const seen = new Set<string>();
      const customerItems: PaletteItem[] = [];
      for (const c of customersRes.data ?? []) {
        const key = c.customer_phone || c.customer_name || "";
        if (!key || seen.has(key)) continue;
        seen.add(key);
        customerItems.push({
          href: `/clientes?q=${encodeURIComponent(c.customer_phone || c.customer_name || "")}`,
          label: c.customer_name || c.customer_phone || "Cliente",
          icon: Users,
          isDynamic: true,
          groupLabel: "Clientes",
        });
        if (customerItems.length >= RESULT_LIMIT) break;
      }

      const productItems: PaletteItem[] = (productsRes.data ?? []).map((p) => ({
        href: `/productos?edit=${p.id}`,
        label: p.name,
        icon: Package,
        isDynamic: true,
        groupLabel: "Productos",
      }));

      setDynamicResults([...orderItems, ...customerItems, ...productItems]);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, tenantId]);

  const results = useMemo(
    () => [...staticResults, ...dynamicResults],
    [staticResults, dynamicResults],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (modifierPressed && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function navigate(item: PaletteItem) {
    router.push(`/${slug}/admin${item.href}`);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)",
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderBottom: "1px solid var(--dash-border)",
          }}
        >
          <Search size={16} color="var(--dash-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir a... o ejecutar una acción"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[activeIndex]) {
                navigate(results[activeIndex]);
              }
            }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--dash-text)",
              fontSize: 15,
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            Esc
          </kbd>
        </div>

        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: 6 }}>
          {results.length === 0 ? (
            <p
              style={{
                padding: "24px 12px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--dash-muted)",
              }}
            >
              {searching ? "Buscando..." : "Sin resultados"}
            </p>
          ) : (
            results.map((item, i) => {
              const isActive = i === activeIndex;
              const prevGroup = i > 0 ? results[i - 1].groupLabel : undefined;
              const showGroupHeader =
                item.groupLabel && item.groupLabel !== prevGroup;
              return (
                <div key={`${item.groupLabel ?? "nav"}-${item.href}-${i}`}>
                  {showGroupHeader && (
                    <p
                      style={{
                        padding: "8px 12px 4px",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--dash-muted)",
                      }}
                    >
                      {item.groupLabel}
                    </p>
                  )}
                  <button
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: isActive ? "var(--dash-surface-2)" : "none",
                      color: isActive
                        ? "var(--dash-text)"
                        : "var(--dash-muted)",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <item.icon
                      size={16}
                      strokeWidth={1.8}
                      color={isActive ? "var(--accent)" : "var(--dash-muted)"}
                    />
                    {item.label}
                    {item.isAction && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--accent)",
                          background: "var(--dash-accent-subtle)",
                          border: "1px solid var(--accent)44",
                          borderRadius: 4,
                          padding: "1px 5px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        ACCIÓN
                      </span>
                    )}
                    {isActive && (
                      <CornerDownLeft
                        size={13}
                        style={{ marginLeft: "auto", opacity: 0.6 }}
                      />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
