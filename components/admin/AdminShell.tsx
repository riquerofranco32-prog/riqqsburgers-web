'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import TakefyyLogo from '@/components/TakefyyLogo'

interface AdminShellProps {
  children: React.ReactNode
  tenantName: string
  slug: string
}

const NAV_ITEMS = [
  { href: '', label: 'Dashboard', icon: '◈' },
  { href: '/pedidos', label: 'Pedidos', icon: '◫' },
  { href: '/productos', label: 'Productos', icon: '▦' },
]

export default function AdminShell({ children, tenantName, slug }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  const sidebarLinks = (
    <>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const href = `/${slug}/admin${item.href}`
          const isActive = item.href === ''
            ? pathname === `/${slug}/admin`
            : pathname.startsWith(href)

          return (
            <Link
              key={item.href}
              href={href}
              onClick={closeMobile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--dash-muted)',
                background: isActive ? 'var(--dash-surface-2)' : 'transparent',
                borderLeft: isActive && !collapsed ? '3px solid var(--accent)' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--dash-surface-2)'; e.currentTarget.style.color = 'var(--dash-text)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dash-muted)' } }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer links */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--dash-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <Link
          href="/admin"
          onClick={closeMobile}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8, fontSize: 13, color: 'var(--accent)',
            textDecoration: 'none', whiteSpace: 'nowrap', opacity: 0.8,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ fontSize: 14 }}>⬡</span>
          {!collapsed && '← Panel Takefyy'}
        </Link>
        <Link
          href={`/${slug}`}
          onClick={closeMobile}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8, fontSize: 13, color: 'var(--dash-muted)',
            textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s',
          }}
        >
          <span>↗</span>
          {!collapsed && 'Ver menú'}
        </Link>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%', background: 'none', border: 'none',
            borderRadius: 8, fontSize: 13, color: 'var(--dash-muted)',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
        >
          <span>⏻</span>
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--dash-bg)',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>

      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────── */}
      <header
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 56,
          background: 'var(--dash-surface)',
          borderBottom: '1px solid var(--dash-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 60,
        }}
      >
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--dash-text)', padding: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {mobileOpen ? (
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            ) : (
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            )}
          </svg>
        </button>

        <span style={{ color: 'var(--dash-text)', fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>
          {tenantName}
        </span>

        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--dash-muted)', padding: 6,
            display: 'flex', alignItems: 'center',
            fontSize: 18,
          }}
          title="Cerrar sesión"
        >
          ⏻
        </button>
      </header>

      {/* ── MOBILE OVERLAY ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0, zIndex: 65,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: collapsed ? 64 : 240,
          minHeight: '100vh',
          background: 'var(--dash-surface)',
          borderRight: '1px solid var(--dash-border)',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Logo + collapse */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid var(--dash-border)',
          minHeight: 64,
        }}>
          {!collapsed && <TakefyyLogo size="sm" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--dash-muted)', fontSize: 18, padding: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Tenant name */}
        {!collapsed && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dash-border)' }}>
            <p style={{ color: 'var(--dash-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Restaurante
            </p>
            <p style={{ color: 'var(--dash-text)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tenantName}
            </p>
          </div>
        )}

        {sidebarLinks}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 260,
          background: 'var(--dash-surface)',
          borderRight: '1px solid var(--dash-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 70,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
          overflowY: 'auto',
        }}
      >
        {/* Logo header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--dash-border)',
          minHeight: 56,
        }}>
          <TakefyyLogo size="sm" />
          <button
            onClick={closeMobile}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dash-muted)', fontSize: 20, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Tenant name */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dash-border)' }}>
          <p style={{ color: 'var(--dash-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Restaurante
          </p>
          <p style={{ color: 'var(--dash-text)', fontSize: 14, fontWeight: 600 }}>{tenantName}</p>
        </div>

        {/* Nav items (same structure, not collapsed) */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const href = `/${slug}/admin${item.href}`
            const isActive = item.href === ''
              ? pathname === `/${slug}/admin`
              : pathname.startsWith(href)
            return (
              <Link
                key={item.href}
                href={href}
                onClick={closeMobile}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 12px', borderRadius: 8,
                  fontSize: 15, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--dash-muted)',
                  background: isActive ? 'var(--dash-surface-2)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--dash-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/admin" onClick={closeMobile}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            <span>⬡</span> ← Panel Takefyy
          </Link>
          <Link href={`/${slug}`} onClick={closeMobile}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, color: 'var(--dash-muted)', textDecoration: 'none' }}>
            <span>↗</span> Ver menú
          </Link>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, width: '100%', background: 'none', border: 'none', fontSize: 13, color: '#f87171', cursor: 'pointer', textAlign: 'left' }}>
            <span>⏻</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <style>{`
        .admin-shell-main {
          flex: 1;
          min-height: 100vh;
          background: var(--dash-bg);
          padding-top: 56px;
        }
        @media (min-width: 768px) {
          .admin-shell-main {
            padding-top: 0;
            margin-left: ${collapsed ? 64 : 240}px;
            transition: margin-left 0.2s ease;
          }
        }
      `}</style>
      <main className="admin-shell-main">
        {children}
      </main>
    </div>
  )
}
