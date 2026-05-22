'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import TakefyyLogo from '@/components/TakefyyLogo'

interface SuperAdminShellProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '◈', exact: true },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: '▦', exact: false },
]

export default function SuperAdminShell({ children }: SuperAdminShellProps) {
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
          {!collapsed && (
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <TakefyyLogo size="sm" />
            </Link>
          )}
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

        {/* Superadmin label */}
        {!collapsed && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--dash-border)',
          }}>
            <p style={{ color: 'var(--dash-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Cuenta
            </p>
            <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
              Super Admin
            </p>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
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

        {/* Footer: logout */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--dash-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
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
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  )
}
