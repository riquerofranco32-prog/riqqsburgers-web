'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Dashboard', icon: '🏠', href: '/admin', exact: true },
  { label: 'Restaurantes', icon: '🏪', href: '/admin/restaurants', exact: false },
  { label: 'Pedidos', icon: '📦', href: '/admin/orders', exact: false },
  { label: 'Configuración', icon: '⚙️', href: '/admin/settings', exact: false },
]

export default function AdminSidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    window.location.href = '/admin'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 0 16px' }}>
      <nav style={{ padding: '0 8px' }}>
        {navLinks.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: 500,
                background: isActive ? 'var(--dash-surface-2)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                color: isActive ? 'var(--dash-text)' : 'var(--dash-muted)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--dash-text)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--dash-muted)'
              }}
            >
              <span style={{ fontSize: 16 }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 8px' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 12px', borderRadius: 8,
            fontSize: 14, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--dash-muted)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
