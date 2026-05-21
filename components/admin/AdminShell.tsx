'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  ExternalLink, LogOut, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  const navItems: NavItem[] = [
    { href: `/${slug}/admin`,               label: 'Dashboard',     icon: LayoutDashboard },
    { href: `/${slug}/admin/pedidos`,        label: 'Pedidos',       icon: ShoppingBag },
    { href: `/${slug}/admin/productos`,      label: 'Menú',          icon: Package },
    { href: `/${slug}/admin/configuracion`,  label: 'Configuración', icon: Settings },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === `/${slug}/admin`) return pathname === href
    return pathname.startsWith(href)
  }

  const sidebarW = collapsed ? 'w-[60px]' : 'w-[240px]'
  const mainML   = collapsed ? 'md:ml-[60px]' : 'md:ml-[240px]'

  const navLinks = (mobile = false) => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        const hide = !mobile && collapsed
        return (
          <Link
            key={href}
            href={href}
            title={hide ? label : undefined}
            onClick={() => mobile && setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all
              ${hide ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
              ${active
                ? 'bg-[#F5A623]/10 text-[#F5A623]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#F5A623]' : ''}`} />
            {!hide && <span>{label}</span>}
          </Link>
        )
      })}
    </>
  )

  const secondaryLinks = (mobile = false) => {
    const hide = !mobile && collapsed
    return (
      <>
        <Link
          href={`/${slug}`}
          target="_blank"
          title={hide ? 'Ver menú' : undefined}
          onClick={() => mobile && setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all
            ${hide ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!hide && <span>Ver menú</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={hide ? 'Salir' : undefined}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all w-full text-left
            ${hide ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!hide && <span>Salir</span>}
        </button>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5' },
        }}
      />

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col ${sidebarW} flex-shrink-0 border-r border-[#2a2a2a] bg-[#111] fixed h-full z-30 transition-[width] duration-200 overflow-hidden`}>

        {/* Header */}
        <div className={`px-3 py-4 border-b border-[#2a2a2a] flex items-center gap-2 min-h-[65px] ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm font-[family-name:var(--font-syne)] text-white truncate">{tenantName}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft  className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {navLinks()}
        </nav>

        <div className={`px-2 pb-5 pt-3 flex flex-col gap-1 border-t border-[#2a2a2a]`}>
          {secondaryLinks()}
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#111]/95 backdrop-blur-sm border-b border-[#2a2a2a] px-4 h-14 flex items-center justify-between">
        <p className="font-bold text-sm font-[family-name:var(--font-syne)]">{tenantName}</p>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="text-zinc-400 hover:text-white p-1 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 bottom-0 w-[240px] bg-[#111] border-r border-[#2a2a2a] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
              {navLinks(true)}
            </nav>
            <div className="px-2 pb-6 pt-3 flex flex-col gap-1 border-t border-[#2a2a2a]">
              {secondaryLinks(true)}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className={`flex-1 ${mainML} pt-14 md:pt-0 min-h-screen transition-[margin] duration-200`}>
        {children}
      </main>
    </div>
  )
}
