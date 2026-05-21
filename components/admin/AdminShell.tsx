'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

export default function AdminShell({
  children,
  slug,
  tenantName,
  userEmail,
}: {
  children: React.ReactNode
  slug: string
  tenantName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: `/${slug}/admin`,          label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${slug}/admin/pedidos`,  label: 'Pedidos',   icon: ShoppingBag },
    { href: `/${slug}/admin/productos`, label: 'Productos', icon: Package },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === `/${slug}/admin`) return pathname === href
    return pathname.startsWith(href)
  }

  const navLinks = (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive(href)
              ? 'bg-yellow-400/10 text-yellow-400'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </>
  )

  const secondaryLinks = (
    <>
      <Link
        href={`/${slug}`}
        target="_blank"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
      >
        <ExternalLink className="w-4 h-4 flex-shrink-0" />
        <span>Ver menú</span>
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all w-full text-left"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span>Salir</span>
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5' },
        }}
      />

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 fixed h-full z-30">
        <div className="px-4 py-5 border-b border-zinc-800">
          <p className="font-bold text-sm font-[family-name:var(--font-syne)] text-white truncate">{tenantName}</p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navLinks}
        </nav>
        <div className="px-3 pb-5 pt-3 flex flex-col gap-1 border-t border-zinc-800">
          {secondaryLinks}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 h-14 flex items-center justify-between">
        <p className="font-bold text-sm font-[family-name:var(--font-syne)]">{tenantName}</p>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="text-zinc-400 hover:text-white p-1 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 bottom-0 w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {navLinks}
            </nav>
            <div className="px-3 pb-6 pt-3 flex flex-col gap-1 border-t border-zinc-800">
              {secondaryLinks}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
