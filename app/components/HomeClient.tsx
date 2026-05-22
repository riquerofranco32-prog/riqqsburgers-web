'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Restaurant } from '@/lib/getRestaurant'
import TakefyyLogo from '@/components/TakefyyLogo'

const ease = [0.22, 1, 0.36, 1] as const

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease },
  }
}

export default function HomeClient({ restaurants }: { restaurants: Restaurant[] }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function scrollToRestaurants() {
    document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#0F0A06', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(15,10,6,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-white">
            <TakefyyLogo size="md" />
          </Link>

          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center gap-8">
            {['Restaurantes', 'Para negocios', 'Contacto'].map(label => (
              <button
                key={label}
                onClick={label === 'Restaurantes' ? scrollToRestaurants : undefined}
                className="text-sm font-medium transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-full text-sm text-white transition-all duration-150 hover:bg-white/15"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              Admin
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:brightness-110"
              style={{ background: 'var(--accent)' }}
            >
              Sumar mi negocio
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" style={{ zIndex: 10 }} />

        {/* Hero content */}
        <div
          className="relative w-full pl-5 sm:pl-8 md:pl-16 lg:pl-24 pr-5"
          style={{ zIndex: 20, paddingTop: 'clamp(60px, 10vw, 100px)' }}
        >
          <div style={{ maxWidth: 600 }}>

            {/* Hero logo */}
            <motion.div {...fadeUp(0)} className="mb-6">
              <TakefyyLogo size="lg" className="text-white" />
            </motion.div>

            {/* Eyebrow */}
            <motion.div {...fadeUp(0.05)} className="mb-6">
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  background: 'rgba(255,107,53,0.15)',
                  border: '1px solid rgba(255,107,53,0.3)',
                  color: 'var(--accent)',
                }}
              >
                🚀 Tu restaurante online en minutos
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              {...fadeUp(0.1)}
              className="font-black text-white mb-6"
              style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Tu menú digital,
              <br />
              tus pedidos
              <br />
              por{' '}
              <span style={{ color: 'var(--accent)' }}>WhatsApp</span> 📲
            </motion.h1>

            {/* Subtext */}
            <motion.p
              {...fadeUp(0.2)}
              className="mb-8 font-normal"
              style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.65)',
                maxWidth: 480,
              }}
            >
              Sin apps, sin complicaciones. Tus clientes ven el menú, eligen lo que
              quieren y te escriben directo por WhatsApp. Vos recibís el pedido listo.
            </motion.p>

            {/* CTA buttons */}
            <motion.div {...fadeUp(0.3)} className="flex gap-3 flex-wrap">
              <motion.button
                onClick={scrollToRestaurants}
                className="flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}
                whileHover={{
                  scale: 1.04,
                  filter: 'brightness(1.1)',
                  boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                Ver restaurantes
                <ArrowDown size={16} />
              </motion.button>

              <motion.button
                className="rounded-full px-6 py-3.5 text-sm font-medium text-white transition-colors duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                Sumar mi negocio
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fadeUp(0.4)} className="flex gap-6 flex-wrap items-center mt-10">
              <div>
                <div className="text-white font-bold text-lg">{restaurants.length}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  restaurantes activos
                </div>
              </div>

              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.2)' }} />

              <div>
                <div className="text-white font-bold text-lg">WhatsApp</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  pedidos directos
                </div>
              </div>

              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.2)' }} />

              <div>
                <div className="text-white font-bold text-lg">0%</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  sin comisiones
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Restaurants section ─────────────────────────────────────────── */}
      <section
        id="restaurants"
        className="py-24 px-5 sm:px-8 relative"
        style={{ zIndex: 20 }}
      >
        <div className="max-w-[1280px] mx-auto">

          {/* Section header */}
          <p
            className="text-xs font-semibold tracking-widest mb-3"
            style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}
          >
            NEGOCIOS ACTIVOS
          </p>
          <h2 className="text-3xl font-black text-white mb-2">
            Explorá los restaurantes
          </h2>
          <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Menú digital, pedidos por WhatsApp
          </p>

          {/* Grid */}
          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r, i) => {
                const logoSrc = r.logo || ''
                const initials = r.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()

                return (
                  <motion.div
                    key={r.slug}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  >
                    <Link
                      href={`/${r.slug}`}
                      className="restaurant-card group flex flex-col gap-4 rounded-2xl p-6 backdrop-blur-sm h-full block"
                    >
                      {/* Logo + name */}
                      <div className="flex items-center gap-4">
                        <div
                          className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-lg"
                          style={{
                            width: 60,
                            height: 60,
                            border: '2px solid #FF6B35',
                            backgroundColor: logoSrc ? 'rgba(255,107,53,0.1)' : '#FF6B35',
                          }}
                        >
                          {logoSrc ? (
                            <Image
                              src={logoSrc}
                              alt={r.name}
                              width={60}
                              height={60}
                              className="w-full h-full object-cover rounded-full"
                              unoptimized
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xl text-white leading-tight truncate">
                            {r.name}
                          </p>
                          <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {r.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between mt-auto">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: 'rgba(255,107,53,0.1)',
                            color: '#FF6B35',
                            border: '1px solid rgba(255,107,53,0.2)',
                          }}
                        >
                          ● Activo
                        </span>
                        <span
                          className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ color: '#FF6B35' }}
                        >
                          Ver menú →
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-5xl mb-4">🍽️</p>
              <p className="text-sm">No hay restaurantes activos todavía.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="py-8 text-center text-xs border-t"
        style={{
          color: 'rgba(255,255,255,0.2)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        Powered by Takefyy • {new Date().getFullYear()}
      </footer>

    </div>
  )
}
