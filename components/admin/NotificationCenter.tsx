"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, AlertTriangle, Star, Percent } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { Order, Review, Coupon } from "@/types/supabase";
import type { TodayKPIsResponse } from "@/types/dashboard";

// Cupón "por vencer" si le quedan <= N días — umbral simple, sin config por tenant.
const COUPON_EXPIRY_WARNING_DAYS = 3;
const MAX_ORDER_EVENTS = 20;

type NotifType = "order" | "stock" | "review" | "coupon";

interface NotifEvent {
  id: string;
  type: NotifType;
  title: string;
  subtitle: string;
  href: string;
  /** epoch ms usado solo para ordenar el feed, no se muestra */
  timestamp: number;
}

interface Props {
  tenantId: string;
  slug: string;
  collapsed?: boolean;
  align?: "left" | "right";
  /** staff no tiene acceso a /resenas ni /cupones — se omiten esos eventos */
  isStaff?: boolean;
}

const ICONS: Record<NotifType, typeof Bell> = {
  order: ShoppingCart,
  stock: AlertTriangle,
  review: Star,
  coupon: Percent,
};

function seenKey(tenantId: string) {
  return `takefyy_notif_seen_${tenantId}`;
}

function loadSeen(tenantId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(seenKey(tenantId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(tenantId: string, ids: Set<string>) {
  try {
    // ponytail: sin límite de tamaño — el set nunca crece más que MAX_ORDER_EVENTS
    // + stock/reviews/coupons recientes, así que no hace falta podarlo.
    localStorage.setItem(seenKey(tenantId), JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage lleno/bloqueado — el contador de no-leídos simplemente no persiste
  }
}

/**
 * Centro de notificaciones del admin: combina, en el cliente, eventos que YA
 * se están trayendo por otras vías (pedidos nuevos por realtime, alertas de
 * stock del endpoint de KPIs) más un fetch liviano de reseñas y cupones por
 * vencer. No hay tabla de notifications ni estado leído/no-leído en el
 * servidor — el "visto" se trackea en localStorage por tenant (YAGNI: evita
 * migración + RLS para algo resoluble 100% client-side).
 */
export default function NotificationCenter({
  tenantId,
  slug,
  collapsed,
  align = "right",
  isStaff = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);
  const [orderEvents, setOrderEvents] = useState<NotifEvent[]>([]);
  const [stockEvents, setStockEvents] = useState<NotifEvent[]>([]);
  const [reviewEvents, setReviewEvents] = useState<NotifEvent[]>([]);
  const [couponEvents, setCouponEvents] = useState<NotifEvent[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => loadSeen(tenantId));
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchLight = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    const [kpisJson, reviewsRes, couponsRes] = await Promise.all([
      fetch(`/api/${slug}/admin/kpis`)
        .then((r) => (r.ok ? (r.json() as Promise<TodayKPIsResponse>) : null))
        .catch(() => null),
      isStaff
        ? Promise.resolve({ data: [] })
        : supabase
            .from("reviews")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(5),
      isStaff
        ? Promise.resolve({ data: [] })
        : supabase
            .from("coupons")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("active", true)
            .not("expires_at", "is", null)
            .order("expires_at", { ascending: true }),
    ]);

    if (kpisJson) {
      setStockEvents([
        ...kpisJson.unavailableProducts.map((p) => ({
          id: `stock-out:${p.id}`,
          type: "stock" as const,
          title: "Producto sin stock",
          subtitle: p.name,
          href: `/${slug}/admin/productos`,
          timestamp: 0,
        })),
        ...kpisJson.lowStockProducts.map((p) => ({
          id: `stock-low:${p.id}`,
          type: "stock" as const,
          title: "Stock bajo",
          subtitle: `${p.name} — quedan ${p.stock_quantity}`,
          href: `/${slug}/admin/productos`,
          timestamp: 0,
        })),
      ]);
    }

    const reviews = (reviewsRes.data ?? []) as Review[];
    setReviewEvents(
      reviews.map((r) => ({
        id: `review:${r.id}`,
        type: "review" as const,
        title: `Nueva reseña — ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`,
        subtitle: r.comment || r.customer_name || "Sin comentario",
        href: `/${slug}/admin/resenas`,
        timestamp: new Date(r.created_at).getTime(),
      })),
    );

    const now = Date.now();
    const warningMs = COUPON_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
    const coupons = (couponsRes.data ?? []) as Coupon[];
    setCouponEvents(
      coupons
        .filter((c) => {
          if (!c.expires_at) return false;
          const diff = new Date(c.expires_at).getTime() - now;
          return diff > 0 && diff <= warningMs;
        })
        .map((c) => ({
          id: `coupon:${c.id}`,
          type: "coupon" as const,
          title: "Cupón por vencer",
          subtitle: `${c.code} — vence el ${new Date(c.expires_at as string).toLocaleDateString("es-AR")}`,
          href: `/${slug}/admin/cupones`,
          // no hay un timestamp "de evento" natural para esto — se ancla a "ahora"
          // para que aparezca arriba del feed mientras esté dentro del umbral
          timestamp: now,
        })),
    );
  }, [slug, tenantId, isStaff]);

  useEffect(() => {
    void fetchLight();
  }, [fetchLight]);

  // Pedido nuevo por realtime (mismo canal/patrón que PendingOrdersBadge). Un
  // pedido nuevo también puede dejar un producto sin stock, así que dispara
  // un refetch liviano del resto.
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`notif-orders-${tenantId}-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const order = payload.new as Order;
          setOrderEvents((prev) =>
            [
              {
                id: `order:${order.id}`,
                type: "order" as const,
                title: `Pedido nuevo — ${order.order_ref}`,
                subtitle: order.customer_name || "Sin nombre",
                href: `/${slug}/admin/pedidos`,
                timestamp: new Date(order.created_at).getTime(),
              },
              ...prev,
            ].slice(0, MAX_ORDER_EVENTS),
          );
          void fetchLight();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, slug, fetchLight]);

  const events = useMemo(
    () =>
      [...orderEvents, ...stockEvents, ...reviewEvents, ...couponEvents].sort(
        (a, b) => b.timestamp - a.timestamp,
      ),
    [orderEvents, stockEvents, reviewEvents, couponEvents],
  );

  const unreadCount = useMemo(
    () => events.filter((e) => !seenIds.has(e.id)).length,
    [events, seenIds],
  );

  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      events.forEach((e) => next.add(e.id));
      saveSeen(tenantId, next);
      return next;
    });
  }, [events, tenantId]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPanelPos({
          top: rect.bottom + 8,
          ...(align === "right"
            ? { right: window.innerWidth - rect.right }
            : { left: rect.left }),
        });
        // pequeño delay para que el punto de "no leído" alcance a verse antes
        // de desaparecer al marcar todo como visto
        setTimeout(markAllSeen, 400);
      }
      return next;
    });
  }

  // Click afuera + Escape cierran; Tab queda atrapado dentro del panel
  // mientras está abierto (focus trap simple, sin librería).
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      style={{ position: "relative", width: collapsed ? "100%" : undefined }}
    >
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        title="Notificaciones"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: collapsed ? "100%" : 36,
          height: 36,
          flexShrink: 0,
          background: open ? "var(--dash-surface-2)" : "none",
          border: "1px solid var(--dash-border)",
          borderRadius: 8,
          color: "var(--dash-muted)",
          cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
          e.currentTarget.style.color = "var(--dash-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--dash-border)";
          e.currentTarget.style.color = "var(--dash-muted)";
        }}
      >
        <Bell size={16} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              minWidth: 15,
              height: 15,
              padding: unreadCount > 9 ? "0 3px" : 0,
              borderRadius: 999,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              boxShadow: "0 0 0 2px var(--dash-surface)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && panelPos && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notificaciones"
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            right: panelPos.right,
            width: "min(360px, 90vw)",
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            zIndex: 150,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--dash-border)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--dash-text)",
              position: "sticky",
              top: 0,
              background: "var(--dash-surface)",
            }}
          >
            Notificaciones
          </div>
          {events.length === 0 ? (
            <p
              style={{
                padding: "24px 14px",
                fontSize: 13,
                color: "var(--dash-muted)",
                textAlign: "center",
              }}
            >
              No hay novedades
            </p>
          ) : (
            events.map((e) => {
              const Icon = ICONS[e.type];
              const isUnseen = !seenIds.has(e.id);
              return (
                <Link
                  key={e.id}
                  href={e.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 14px",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--dash-border)",
                    background: isUnseen
                      ? "rgba(255,107,53,0.06)"
                      : "transparent",
                  }}
                >
                  <Icon
                    size={15}
                    style={{
                      color: "var(--accent)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--dash-text)",
                        marginBottom: 2,
                      }}
                    >
                      {e.title}
                    </p>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "var(--dash-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
