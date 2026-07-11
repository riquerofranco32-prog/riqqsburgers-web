"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Tag,
  Settings,
  Crown,
  ExternalLink,
  LogOut,
  ArrowLeftFromLine,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Users,
  Percent,
  Star,
  UserCog,
  UserCircle,
  WifiOff,
  BarChart3,
  Search,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase";
import TakefyyLogo from "@/components/TakefyyLogo";
import PendingOrdersBadge from "@/components/admin/PendingOrdersBadge";
import NotificationToggle from "@/components/admin/NotificationToggle";
import { CommandPalette } from "@/components/admin/CommandPalette";

interface AdminShellProps {
  children: React.ReactNode;
  tenantName: string;
  tenantLogoUrl?: string | null;
  slug: string;
  tenantId: string;
  userEmail: string;
  isSuperAdmin?: boolean;
  role?: string;
}

const FULL_NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> =
  [
    { href: "", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/categorias", label: "Categorías", icon: Tag },
    { href: "/cupones", label: "Cupones", icon: Percent },
    { href: "/resenas", label: "Reseñas", icon: Star },
    { href: "/qr", label: "Código QR", icon: QrCode },
    { href: "/equipo", label: "Equipo", icon: UserCog },
    { href: "/configuracion", label: "Configuración", icon: Settings },
    { href: "/plan", label: "Mi Plan", icon: Crown },
    { href: "/mi-cuenta", label: "Mi cuenta", icon: UserCircle },
  ];

// Personal de cocina/mozo: solo ve y gestiona pedidos, nada de precios/config/billing
const STAFF_NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/mi-cuenta", label: "Mi cuenta", icon: UserCircle },
];

function getNavItems(role?: string) {
  return role === "staff" ? STAFF_NAV_ITEMS : FULL_NAV_ITEMS;
}

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

interface DesktopNavLinksProps {
  slug: string;
  tenantId: string;
  collapsed: boolean;
  pathname: string;
  onLogout: () => void;
  loggingOut: boolean;
  isSuperAdmin: boolean;
  navItems: ReturnType<typeof getNavItems>;
}

function DesktopNavLinks({
  slug,
  tenantId,
  collapsed,
  pathname,
  onLogout,
  loggingOut,
  isSuperAdmin,
  navItems,
}: DesktopNavLinksProps) {
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
        {navItems.map((item) => {
          const href = `/${slug}/admin${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === `/${slug}/admin`
              : pathname.startsWith(href);
          return (
            <Link
              key={item.href}
              href={href}
              title={collapsed ? item.label : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                paddingLeft:
                  collapsed && isActive ? "calc(0px - 3px)" : undefined,
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#fff" : "var(--dash-muted)",
                background: isActive
                  ? `linear-gradient(135deg, var(--accent), var(--accent-hover))`
                  : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                boxShadow: isActive
                  ? `0 4px 12px rgba(255,107,53,0.3)`
                  : "none",
                borderLeft: collapsed
                  ? isActive
                    ? "3px solid var(--accent)"
                    : "3px solid transparent"
                  : "none",
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
              <item.icon size={16} strokeWidth={1.8} />
              {collapsed && item.href === "/pedidos" && (
                <PendingOrdersBadge tenantId={tenantId} collapsed={true} />
              )}
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.href === "/pedidos" && (
                    <PendingOrdersBadge tenantId={tenantId} collapsed={false} />
                  )}
                </>
              )}
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
        {isSuperAdmin && (
          <Link
            href="/admin"
            title={collapsed ? "Panel Takefyy" : undefined}
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
            <ArrowLeftFromLine size={14} strokeWidth={1.8} />
            {!collapsed && "Panel Takefyy"}
          </Link>
        )}
        <Link
          href={`/${slug}/admin/preview`}
          title={collapsed ? "Ver menú" : undefined}
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
          <ExternalLink size={14} strokeWidth={1.8} />
          {!collapsed && "Ver menú"}
        </Link>
        <NotificationToggle tenantId={tenantId} collapsed={collapsed} />
        <button
          onClick={onLogout}
          disabled={loggingOut}
          title={collapsed ? "Cerrar sesión" : undefined}
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
            color: loggingOut ? "#f87171" : "var(--dash-muted)",
            cursor: loggingOut ? "default" : "pointer",
            whiteSpace: "nowrap",
            transition: "color 0.15s",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
            opacity: loggingOut ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            if (!loggingOut) e.currentTarget.style.color = "var(--dash-muted)";
          }}
        >
          <LogOut
            size={14}
            strokeWidth={1.8}
            style={loggingOut ? { animation: "spin 1s linear infinite" } : {}}
          />
          {!collapsed && (loggingOut ? "Cerrando..." : "Cerrar sesión")}
        </button>
      </div>
    </>
  );
}

export default function AdminShell({
  children,
  tenantName,
  tenantLogoUrl,
  slug,
  tenantId,
  userEmail,
  isSuperAdmin = false,
  role,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = getNavItems(role);
  const isStaff = role === "staff";
  // Ambos estados arrancan con el valor del server y se corrigen recién en un
  // efecto: leerlos en el initializer (localStorage / hora local) hacía que el
  // primer render del cliente no coincidiera con el HTML del server (que corre
  // en UTC y sin localStorage) — error de hidratación #425 en prod.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  // Arranca en true (asumido online) para no desincronizar con el HTML del
  // server; se corrige al montar, mismo criterio que collapsed más arriba.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("sidebar_collapsed") === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restablecida");
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const tick = () =>
      setClockTime(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  // Lock body scroll while mobile dropdown menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--dash-bg)",
        fontFamily: "var(--font-sans, system-ui)",
        // Asegurar que el admin NUNCA herede el accent del tenant del catálogo público
        // Estas variables son del dash y sobreescriben cualquier inyección del CatalogClient
        ["--accent" as string]: "#FF6B35",
        ["--surface" as string]: "var(--dash-surface)",
        ["--surface-2" as string]: "var(--dash-surface-2)",
        ["--border" as string]: "var(--dash-border)",
        ["--text-primary" as string]: "var(--dash-text)",
        ["--text-secondary" as string]: "var(--dash-muted)",
      }}
    >
      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────────── */}
      <header
        className="lg:hidden flex items-center justify-between"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "var(--dash-surface)",
          borderBottom: "1px solid var(--dash-border)",
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
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingRight: 8,
          }}
        >
          <TakefyyLogo size="sm" />
        </div>
      </header>

      {/* ── MOBILE OVERLAY ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          onClick={closeMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── MOBILE DROPDOWN MENU ────────────────────────────────────────────── */}
      <div
        className="lg:hidden flex flex-col"
        style={{
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          background: "var(--dash-surface)",
          borderBottom: mobileOpen ? "1px solid var(--dash-border)" : "none",
          zIndex: 55,
          flexDirection: "column",
          maxHeight: mobileOpen ? "calc(100vh - 56px)" : 0,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          overflow: mobileOpen ? "auto" : "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <nav
          style={{
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {navItems.map((item) => {
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
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "var(--dash-text)",
                  background: isActive
                    ? `linear-gradient(135deg, var(--accent), var(--accent-hover))`
                    : "var(--dash-surface-2)",
                  border: isActive ? "none" : "1px solid var(--dash-border)",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                  boxShadow: isActive
                    ? `0 4px 12px rgba(255,107,53,0.25)`
                    : "none",
                }}
              >
                <item.icon
                  size={18}
                  strokeWidth={2}
                  style={{
                    flexShrink: 0,
                    color: isActive ? "#fff" : "var(--accent)",
                  }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.href === "/pedidos" && (
                  <PendingOrdersBadge tenantId={tenantId} />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: "12px 12px 24px",
            borderTop: "1px solid var(--dash-border)",
            background: "rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {userEmail && (
            <p
              style={{
                fontSize: 11,
                color: "var(--dash-muted)",
                textAlign: "center",
                padding: "0 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </p>
          )}
          <NotificationToggle tenantId={tenantId} />
          <div style={{ display: "flex", gap: 8 }}>
            {isSuperAdmin && (
              <Link
                href="/admin"
                onClick={closeMobile}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "var(--dash-surface-2)",
                  border: "1px solid var(--dash-border)",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                <ArrowLeftFromLine size={14} />
                Panel
              </Link>
            )}
            <Link
              href={`/${slug}/admin/preview`}
              onClick={closeMobile}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--dash-text)",
                background: "var(--dash-surface-2)",
                border: "1px solid var(--dash-border)",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              <ExternalLink size={14} />
              Ver menú
            </Link>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 10,
              width: "100%",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontSize: 13,
              fontWeight: 600,
              color: "#f87171",
              cursor: loggingOut ? "default" : "pointer",
              opacity: loggingOut ? 0.7 : 1,
            }}
          >
            <LogOut
              size={14}
              style={loggingOut ? { animation: "spin 1s linear infinite" } : {}}
            />
            {loggingOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col"
        style={{
          width: collapsed ? 64 : 240,
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, var(--dash-surface) 0%, var(--dash-surface-2) 100%)",
          borderRight: "1px solid var(--dash-border)",
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem("sidebar_collapsed", String(next));
            }}
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
            {collapsed ? (
              <ChevronRight size={16} strokeWidth={2} />
            ) : (
              <ChevronLeft size={16} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Tenant name */}
        {!collapsed && (
          <div
            style={{
              padding: "10px 16px 14px",
              borderBottom: "1px solid var(--dash-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--dash-surface-2)",
                borderRadius: 10,
                padding: "10px 12px",
                border: "1px solid var(--dash-border)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: tenantLogoUrl
                    ? "var(--dash-surface)"
                    : "linear-gradient(135deg, var(--accent), #ff8c5a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {tenantLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenantLogoUrl}
                    alt={tenantName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  tenantName.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    color: "var(--dash-muted)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 1,
                  }}
                >
                  Restaurante
                </p>
                <p
                  style={{
                    color: "var(--dash-text)",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tenantName}
                </p>
                <p
                  style={{
                    color: "var(--dash-muted)",
                    fontSize: 10,
                    marginTop: 1,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.02em",
                  }}
                >
                  {clockTime}
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: collapsed ? "8px" : "0 8px", marginTop: 8 }}>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-command-palette"))
            }
            title="Buscar (Ctrl+K)"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 8,
              padding: collapsed ? "8px" : "8px 10px",
              borderRadius: 8,
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-muted)",
              fontSize: 12,
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--dash-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--dash-border)";
              e.currentTarget.style.color = "var(--dash-muted)";
            }}
          >
            <Search size={14} strokeWidth={1.8} />
            {!collapsed && (
              <>
                <span style={{ flex: 1, textAlign: "left" }}>Buscar</span>
                <kbd
                  style={{
                    fontSize: 10,
                    color: "var(--dash-muted)",
                    background: "var(--dash-bg)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  Ctrl K
                </kbd>
              </>
            )}
          </button>
        </div>

        <DesktopNavLinks
          slug={slug}
          tenantId={tenantId}
          collapsed={collapsed}
          pathname={pathname}
          onLogout={handleLogout}
          loggingOut={loggingOut}
          isSuperAdmin={isSuperAdmin}
          navItems={navItems}
        />
      </aside>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────────── */}
      <nav
        className="flex lg:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: "var(--dash-surface)",
          borderTop: "1px solid var(--dash-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {(isStaff
          ? navItems
          : [
              { href: "", label: "Dashboard", icon: LayoutDashboard },
              { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
              { href: "/productos", label: "Productos", icon: Package },
              { href: "/configuracion", label: "Config", icon: Settings },
            ]
        ).map((item) => {
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
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: "10px 4px",
                color: isActive ? "var(--accent)" : "var(--dash-muted)",
                textDecoration: "none",
                position: "relative",
                WebkitTapHighlightColor: "transparent",
                transition: "color 0.15s",
              }}
            >
              <div style={{ position: "relative" }}>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.href === "/pedidos" && (
                  <PendingOrdersBadge tenantId={tenantId} collapsed={true} />
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: "0.01em",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 28,
                    height: 2,
                    borderRadius: 999,
                    background: "var(--accent)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <style>{`
        .admin-shell-main {
          flex: 1;
          min-height: 100vh;
          position: relative;
          background: var(--dash-bg);
          padding-top: calc(56px + env(safe-area-inset-top, 0px));
          padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        }
        .admin-shell-main::before {
          content: "";
          position: fixed;
          top: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          max-width: 700px;
          max-height: 700px;
          background: radial-gradient(circle, rgba(255,107,53,0.08) 0%, rgba(255,107,53,0) 70%);
          pointer-events: none;
          z-index: 0;
        }
        .admin-shell-main > * {
          position: relative;
          z-index: 1;
        }
        @media (min-width: 1024px) {
          .admin-shell-main {
            padding-top: 0;
            padding-bottom: 0;
            margin-left: ${collapsed ? 64 : 240}px;
            transition: margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <main className="admin-shell-main">
        {!isOnline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "8px 12px",
              background: "#f59e0b",
              color: "#1a1208",
              fontSize: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <WifiOff size={14} strokeWidth={2.2} />
            Sin conexión — los cambios no se van a guardar hasta que vuelva
            internet
          </div>
        )}
        {children}
      </main>
      <CommandPalette navItems={navItems} slug={slug} />
    </div>
  );
}
