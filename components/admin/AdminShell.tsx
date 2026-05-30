"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase";
import TakefyyLogo from "@/components/TakefyyLogo";

interface AdminShellProps {
  children: React.ReactNode;
  tenantName: string;
  slug: string;
}

const NAV_ITEMS = [
  { href: "", label: "Dashboard", icon: "◈" },
  { href: "/pedidos", label: "Pedidos", icon: "◫" },
  { href: "/productos", label: "Productos", icon: "▦" },
  { href: "/categorias", label: "Categorías", icon: "▤" },
  { href: "/configuracion", label: "Configuración", icon: "⚙" },
  { href: "/plan", label: "Mi Plan", icon: "✦" },
];

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

export default function AdminShell({
  children,
  tenantName,
  slug,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const swipeStartX = useRef<number | null>(null);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  // Swipe-left to close drawer
  function onDrawerTouchStart(e: React.TouchEvent) {
    swipeStartX.current = e.touches[0].clientX;
  }
  function onDrawerTouchEnd(e: React.TouchEvent) {
    if (swipeStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (delta < -60) {
      closeMobile();
      vibrate(30);
    }
  }

  // ── Desktop sidebar links (shared) ──────────────────────────────────────────
  function DesktopNavLinks() {
    return (
      <>
        <nav
          style={{
            flex: 1,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const href = `/${slug}/admin${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === `/${slug}/admin`
                : pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--accent)" : "var(--dash-muted)",
                  background: isActive
                    ? "var(--dash-surface-2)"
                    : "transparent",
                  borderLeft:
                    isActive && !collapsed
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--dash-surface-2)";
                    e.currentTarget.style.color = "var(--dash-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--dash-muted)";
                  }
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid var(--dash-border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              opacity: 0.8,
              transition: "opacity 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            <span style={{ fontSize: 14 }}>⬡</span>
            {!collapsed && "← Panel Takefyy"}
          </Link>
          <Link
            href={`/${slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--dash-muted)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span>↗</span>
            {!collapsed && "Ver menú"}
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%",
              background: "none",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--dash-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--dash-muted)")
            }
          >
            <span>⏻</span>
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--dash-bg)",
        fontFamily: "var(--font-sans, system-ui)",
      }}
    >
      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────────── */}
      <header
        className="md:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "var(--dash-surface)",
          borderBottom: "1px solid var(--dash-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 4,
          paddingRight: 4,
          paddingTop: "env(safe-area-inset-top, 0px)",
          zIndex: 60,
          minHeight: 56,
        }}
      >
        {/* Hamburger — 44×44 touch target */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--dash-text)",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen ? (
              <path
                d="M4 4L18 18M18 4L4 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M2 6h18M2 11h18M2 16h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        {/* Restaurant name */}
        <span
          style={{
            color: "var(--dash-text)",
            fontSize: 14,
            fontWeight: 700,
            flex: 1,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 8px",
          }}
        >
          {tenantName}
        </span>

        {/* Takefyy logo — right */}
        <div
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TakefyyLogo size="sm" />
        </div>
      </header>

      {/* ── MOBILE OVERLAY ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          onClick={closeMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 65,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────────── */}
      <aside
        className="md:hidden"
        onTouchStart={onDrawerTouchStart}
        onTouchEnd={onDrawerTouchEnd}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 272,
          background: "var(--dash-surface)",
          borderRight: "1px solid var(--dash-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 70,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
          overflowY: "auto",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Logo header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid var(--dash-border)",
            minHeight: 56,
            flexShrink: 0,
          }}
        >
          <TakefyyLogo size="sm" />
          <button
            onClick={closeMobile}
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--dash-muted)",
              fontSize: 22,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ×
          </button>
        </div>

        {/* Tenant name */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--dash-border)",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              color: "var(--dash-muted)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 2,
            }}
          >
            Restaurante
          </p>
          <p
            style={{
              color: "var(--dash-text)",
              fontSize: 15,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tenantName}
          </p>
        </div>

        {/* Nav items — 52px min height, 16px font */}
        <nav
          style={{
            flex: 1,
            padding: "8px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const href = `/${slug}/admin${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === `/${slug}/admin`
                : pathname.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                onClick={closeMobile}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 14px",
                  minHeight: 52,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--accent)" : "var(--dash-text)",
                  background: isActive
                    ? "var(--dash-surface-2)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "8px 8px",
            borderTop: "1px solid var(--dash-border)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Link
            href="/admin"
            onClick={closeMobile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 14px",
              minHeight: 48,
              borderRadius: 10,
              fontSize: 14,
              color: "var(--accent)",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 18 }}>⬡</span> ← Panel Takefyy
          </Link>
          <Link
            href={`/${slug}`}
            onClick={closeMobile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 14px",
              minHeight: 48,
              borderRadius: 10,
              fontSize: 14,
              color: "var(--dash-muted)",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 18 }}>↗</span> Ver menú
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 14px",
              minHeight: 48,
              borderRadius: 10,
              width: "100%",
              background: "none",
              border: "none",
              fontSize: 14,
              color: "#f87171",
              cursor: "pointer",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: 18 }}>⏻</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex"
        style={{
          width: collapsed ? 64 : 240,
          minHeight: "100vh",
          background: "var(--dash-surface)",
          borderRight: "1px solid var(--dash-border)",
          flexDirection: "column",
          transition: "width 0.2s ease",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflow: "hidden",
        }}
      >
        {/* Logo + collapse */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "20px 0" : "20px 16px",
            borderBottom: "1px solid var(--dash-border)",
            minHeight: 64,
          }}
        >
          {!collapsed && <TakefyyLogo size="sm" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--dash-muted)",
              fontSize: 18,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Tenant name */}
        {!collapsed && (
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--dash-border)",
            }}
          >
            <p
              style={{
                color: "var(--dash-muted)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 2,
              }}
            >
              Restaurante
            </p>
            <p
              style={{
                color: "var(--dash-text)",
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tenantName}
            </p>
          </div>
        )}

        <DesktopNavLinks />
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <style>{`
        .admin-shell-main {
          flex: 1;
          min-height: 100vh;
          background: var(--dash-bg);
          padding-top: calc(56px + env(safe-area-inset-top, 0px));
        }
        @media (min-width: 768px) {
          .admin-shell-main {
            padding-top: 0;
            margin-left: ${collapsed ? 64 : 240}px;
            transition: margin-left 0.2s ease;
          }
        }
      `}</style>
      <main className="admin-shell-main">{children}</main>
    </div>
  );
}
