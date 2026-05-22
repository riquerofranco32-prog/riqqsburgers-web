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

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--dash-bg)',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: 'var(--dash-surface)',
        borderRight: '1px solid var(--dash-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>

        {/* Logo + colapso */}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dash-muted)',
              fontSize: 18,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Tenant name */}
        {!collapsed && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--dash-border)',
          }}>
            <p style={{ color: 'var(--dash-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Restaurante
            </p>
            <p style={{ color: 'var(--dash-text)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tenantName}
            </p>
          </div>
        )}

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
                  borderLeft: isActive && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: panel takefyy + ver menú + logout */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--dash-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <Link
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--accent)',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
              whiteSpace: 'nowrap',
              opacity: 0.8,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
          >
            <span style={{ fontSize: 14 }}>⬡</span>
            {!collapsed && '← Panel Takefyy'}
          </Link>
          <Link
            href={`/${slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--dash-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <span>↗</span>
            {!collapsed && 'Ver menú'}
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              background: 'none',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--dash-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
          >
            <span>⏻</span>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{
        marginLeft: collapsed ? 64 : 240,
        flex: 1,
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh',
        background: 'var(--dash-bg)',
      }}>
        {children}
      </main>
    </div>
  )
}
