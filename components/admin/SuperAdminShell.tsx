"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase";
import TakefyyLogo from "@/components/TakefyyLogo";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/restaurants",
    label: "Restaurantes",
    icon: Store,
    exact: false,
  },
  {
    href: "/admin/subscriptions",
    label: "Suscripciones",
    icon: CreditCard,
    exact: false,
  },
  {
    href: "/admin/team",
    label: "Equipo",
    icon: Users,
    exact: false,
  },
];

export default function SuperAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
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
      }}
    >
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

        <span
          style={{
            color: "var(--dash-text)",
            fontSize: 14,
            fontWeight: 700,
            flex: 1,
            textAlign: "center",
          }}
        >
          Super Admin Panel
        </span>

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
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
                    ? "var(--accent)"
                    : "var(--dash-surface-2)",
                  textDecoration: "none",
                }}
              >
                <item.icon
                  size={18}
                  style={{ color: isActive ? "#fff" : "var(--accent)" }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          style={{
            padding: "12px 12px 24px",
            borderTop: "1px solid var(--dash-border)",
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 10,
              width: "100%",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              cursor: "pointer",
              border: "none",
            }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>

      <aside
        className="hidden lg:flex lg:flex-col"
        style={{
          width: collapsed ? 64 : 240,
          minHeight: "100vh",
          background: "var(--dash-surface)",
          borderRight: "1px solid var(--dash-border)",
          transition: "width 0.2s",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflow: "hidden",
        }}
      >
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
          {!collapsed && (
            <Link href="/">
              <TakefyyLogo size="sm" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--dash-muted)",
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

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
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  color: isActive ? "var(--accent)" : "var(--dash-muted)",
                  background: isActive
                    ? "var(--dash-surface-2)"
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                <item.icon size={16} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid var(--dash-border)",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--dash-muted)",
            }}
          >
            <LogOut size={14} />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <style>{`
        .super-admin-main {
          flex: 1;
          min-height: 100vh;
          background: var(--dash-bg);
          padding-top: calc(56px + env(safe-area-inset-top, 0px));
        }
        @media (min-width: 1024px) {
          .super-admin-main {
            padding-top: 0;
            margin-left: ${collapsed ? 64 : 240}px;
            transition: margin-left 0.2s;
          }
        }
      `}</style>
      <main className="super-admin-main">{children}</main>
    </div>
  );
}
