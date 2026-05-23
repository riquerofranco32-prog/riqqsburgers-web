'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TakefyyLogo from '@/components/TakefyyLogo'

const ease = [0.22, 1, 0.36, 1] as const

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  }
}

function AnimatedCounter({ target, prefix = '+' }: { target: number; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const duration = 1200
        const startTime = Date.now()
        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{prefix}{count}</span>
}

function StepNumber({ n }: { n: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      fontSize: '6rem', fontWeight: 800, color: 'var(--accent)',
      lineHeight: 1, marginBottom: 16, letterSpacing: '-0.04em',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {n}
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.4 }}>{q}</span>
        <span style={{
          flexShrink: 0,
          width: 28, height: 28,
          borderRadius: '50%',
          background: open ? 'var(--accent)' : 'var(--surface-2)',
          color: open ? '#fff' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 300,
          transition: 'all 0.22s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ paddingBottom: 20, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const features = [
  { n: '01', title: 'Cargás tu menú', desc: 'Productos, fotos, precios y categorías. En minutos tenés tu carta lista.' },
  { n: '02', title: 'Compartís el link', desc: 'Tu URL propia: takefyy.com/tu-restaurante. Lista al instante para compartir.' },
  { n: '03', title: 'Recibís pedidos', desc: 'Directo a tu WhatsApp, sin intermediarios, sin comisiones por cada pedido.' },
]

const showcaseFeatures = [
  'Catálogo con fotos, precios y categorías',
  'Badges: Popular, Nuevo, Promo, Agotado',
  'Carrito y pedido directo por WhatsApp',
  'Panel admin del restaurante incluido',
  'URL propia: takefyy.com/{tu-negocio}',
  'Sin comisiones por pedido',
]

const testimonials = [
  {
    name: 'Martina G.',
    restaurant: 'Burguer Palace · Buenos Aires',
    text: 'En un día ya estábamos tomando pedidos por WhatsApp. Mis clientes lo aman porque es simple y rápido.',
    initials: 'MG',
    stars: 5,
  },
  {
    name: 'Roberto P.',
    restaurant: 'La Parrilla de Juan · Córdoba',
    text: 'Dejé de perder tiempo en llamadas. Ahora el cliente elige, yo confirmo y listo. Sin app, sin locura.',
    initials: 'RP',
    stars: 5,
  },
  {
    name: 'Sofía V.',
    restaurant: 'Sushi Express · Rosario',
    text: 'El panel admin es súper intuitivo. Actualizo precios en segundos y mis clientes lo ven al instante.',
    initials: 'SV',
    stars: 5,
  },
]

const plans = [
  {
    name: 'Base',
    price: '$8.999',
    period: '/mes',
    desc: 'Todo lo que necesitás para empezar',
    features: ['1 restaurante', 'Menú digital ilimitado', 'Pedidos por WhatsApp', 'Panel admin', 'URL propia'],
    cta: 'Empezar →',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$14.999',
    period: '/mes',
    desc: 'Para negocios con más demanda',
    features: ['Hasta 5 sucursales', 'Todo el plan Base', 'Analytics de ventas', 'Soporte prioritario', 'Múltiples admins'],
    cta: 'Empezar →',
    featured: true,
  },
  {
    name: 'Multi',
    price: '$29.999',
    period: '/mes',
    desc: 'Para cadenas y dark kitchens',
    features: ['Todo el plan Pro', 'Hasta 5 sucursales', 'Panel unificado', 'Múltiples admins', 'Reportes por sucursal'],
    cta: 'Contactar →',
    featured: false,
  },
]

const faqs = [
  { q: '¿Necesito saber programar?', a: 'Para nada. El panel es tan intuitivo que cualquier persona puede armarlo en minutos. Solo cargás tus productos, poné los precios y listo.' },
  { q: '¿Cómo llegan los pedidos?', a: 'Directo a tu WhatsApp. El cliente arma su pedido, hace click en "Hacer pedido" y te manda un mensaje con todos los detalles: nombre, dirección y qué pidió.' },
  { q: '¿Puedo personalizar los colores y logo?', a: 'Sí. Cada restaurante tiene su propia paleta de colores, logo e información de contacto. Tu menú va a tener tu identidad.' },
  { q: '¿Hay comisión por pedido?', a: 'No. Pagás la suscripción mensual y listo. Sin sorpresas, sin porcentajes por cada venta. El dinero de tus clientes es tuyo.' },
  { q: '¿Qué pasa cuando termina el período de prueba?', a: 'Te avisamos antes de que expire. Si querés continuar, elegís un plan. Si no, no te cobramos nada.' },
  { q: '¿Puedo cancelar cuando quiero?', a: 'Sí. Sin permanencia, sin letras chicas. Si no te convence, cancelás en un click y no pasa nada.' },
]

function PhoneMockup() {
  return (
    <div style={{
      width: 260,
      height: 480,
      background: '#1A1D24',
      borderRadius: 32,
      border: '2px solid #2A2D35',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: 10, color: '#F0EDE8', fontWeight: 600 }}>9:41</span>
        <div style={{ width: 48, height: 6, background: '#0E1116', borderRadius: 8 }} />
        <span style={{ fontSize: 10, color: '#F0EDE8' }}>●●●</span>
      </div>
      {/* Header */}
      <div style={{ background: '#FF6B35', borderRadius: 12, padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Riqq&apos;s Burgers</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Abierto · Hacé tu pedido</div>
      </div>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Burgers', 'Bebidas', 'Promos'].map((c, i) => (
          <div key={c} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 20,
            background: i === 0 ? '#FF6B35' : '#22262F',
            color: i === 0 ? '#fff' : '#8A8D95',
            fontWeight: 600,
          }}>{c}</div>
        ))}
      </div>
      {/* Products */}
      {[
        { name: 'Smash Clásica', price: '$3.500', badge: 'Popular' },
        { name: 'BBQ Doble', price: '$4.800', badge: null },
        { name: 'Chicken Crispy', price: '$3.900', badge: 'Nuevo' },
      ].map(p => (
        <div key={p.name} style={{
          background: '#22262F', borderRadius: 10, padding: '8px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#F0EDE8', fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 9, color: '#FF6B35', fontWeight: 700, marginTop: 2 }}>{p.price}</div>
          </div>
          {p.badge && (
            <div style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 20,
              background: 'rgba(255,107,53,0.15)', color: '#FF6B35', fontWeight: 600,
              border: '1px solid rgba(255,107,53,0.3)',
            }}>{p.badge}</div>
          )}
        </div>
      ))}
      {/* Cart */}
      <div style={{
        background: '#FF6B35', borderRadius: 10, padding: '8px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 'auto',
      }}>
        <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Ver carrito (2)</span>
        <span style={{ fontSize: 10, color: '#fff' }}>$7.400 →</span>
      </div>
    </div>
  )
}

export default function HomeClient({ restaurantCount }: { restaurantCount: number }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  function scrollTo(id: string) {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const navLinks = [
    { label: 'Producto', id: 'producto' },
    { label: 'Precios', id: 'precios' },
    { label: 'Clientes', id: 'clientes' },
    { label: 'FAQ', id: 'faq' },
  ]

  return (
    <div style={{ background: 'var(--brand-dark)', color: 'var(--dash-text)', fontFamily: 'var(--font-sans)' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(14,17,22,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,107,53,0.15)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" style={{ color: 'var(--dash-text)' }}>
            <TakefyyLogo size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm font-medium"
                style={{ color: 'var(--dash-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--dash-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium"
              style={{ color: 'var(--dash-muted)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--dash-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
            >
              Iniciar sesión
            </Link>
            <button
              onClick={() => scrollTo('precios')}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer', transition: 'filter 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = '')}
            >
              Empezar →
            </button>
            <button
              className="md:hidden p-2"
              style={{ color: 'var(--dash-text)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {mobileOpen ? (
                  <path d="M4 4L18 18M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                ) : (
                  <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{
              background: 'rgba(14,17,22,0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,107,53,0.12)',
              padding: '28px 24px 36px',
            }}
          >
            {navLinks.map((l, i) => (
              <motion.button
                key={l.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                onClick={() => scrollTo(l.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--dash-text)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                {l.label}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navLinks.length * 0.05, duration: 0.25 }}
            >
              <Link
                href="/login"
                style={{
                  display: 'block',
                  marginTop: 32,
                  padding: '16px',
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: 12,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                }}
              >
                Empezar gratis →
              </Link>
            </motion.div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: '#0E1116',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 64,
      }}>
        {/* Grain texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
          pointerEvents: 'none',
        }} />

        {/* Glow naranja bottom-left */}
        <div style={{
          position: 'absolute', bottom: '-8%', left: '-4%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Glow tenue top-right */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full py-20 md:py-0" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left col */}
            <div>
              {/* Badge */}
              <motion.div {...fadeUp(0)} className="mb-5">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', color: 'var(--accent)' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#22c55e', display: 'inline-block',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                  Menú digital + WhatsApp en minutos
                </span>
              </motion.div>

              {/* Headline */}
              <div className="font-bold mb-6" style={{
                fontSize: 'clamp(2.4rem, 7vw, 6rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.03em',
                color: '#fff',
              }}>
                <motion.div {...fadeUp(0.1)}>Tu carta,</motion.div>
                <motion.div {...fadeUp(0.2)} style={{ color: 'var(--accent)' }}>online</motion.div>
                <motion.div {...fadeUp(0.3)}>en minutos.</motion.div>
              </div>

              <motion.p {...fadeUp(0.4)} className="mb-10"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.7, color: 'var(--dash-muted)', maxWidth: 480 }}>
                Creá el menú digital de tu restaurante, compartilo por WhatsApp
                y recibí pedidos al instante. Sin apps, sin comisiones.
              </motion.p>

              <motion.div {...fadeUp(0.5)} className="flex flex-wrap gap-3 mb-12">
                <motion.button
                  onClick={() => scrollTo('precios')}
                  className="rounded-full px-7 py-3.5 text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
                  whileHover={{ scale: 1.04, filter: 'brightness(1.1)', boxShadow: '0 4px 24px rgba(255,107,53,0.35)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  Empezar gratis →
                </motion.button>
                <motion.a
                  href="/riqqsburgers"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold"
                  style={{ border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', background: 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  Ver demo
                </motion.a>
              </motion.div>

              {/* Social proof */}
              <motion.div {...fadeUp(0.6)} className="flex items-center gap-4 flex-wrap">
                <div className="flex">
                  {['MG', 'RP', 'SV', 'JC'].map((ini, i) => (
                    <div key={ini} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `hsl(${20 + i * 30}, 70%, 45%)`,
                      border: '2px solid var(--brand-dark)',
                      marginLeft: i === 0 ? 0 : -10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>{ini}</div>
                  ))}
                </div>
                <div style={{ color: 'var(--dash-muted)', fontSize: 14 }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    <AnimatedCounter target={Math.max(restaurantCount, 50)} /> restaurantes
                  </span>{' '}
                  ya usan Takefyy en Argentina
                </div>
              </motion.div>
            </div>

            {/* Right col — desktop only */}
            <div className="hidden md:flex justify-center items-center">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  filter: 'drop-shadow(0 32px 64px rgba(255,107,53,0.22)) drop-shadow(0 8px 24px rgba(0,0,0,0.45))',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 300, height: 300,
                  background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: -1,
                }} />
                <PhoneMockup />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="producto" style={{ background: 'var(--brand-cream)', padding: '96px 0' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease }} className="mb-16">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>CÓMO FUNCIONA</p>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Tan simple que da
              <br />vergüenza ajena.
            </h2>
          </motion.div>

          {/* Grid con conector punteado */}
          <div style={{ position: 'relative' }}>
            {/* Línea conectora desktop */}
            <div className="hidden md:block" style={{
              position: 'absolute',
              top: 48,
              left: '20%',
              right: '20%',
              height: 1,
              background: 'repeating-linear-gradient(90deg, var(--accent) 0, var(--accent) 6px, transparent 6px, transparent 16px)',
              opacity: 0.3,
              zIndex: 0,
            }} />

            <div className="grid md:grid-cols-3 gap-10">
              {features.map((f, i) => (
                <motion.div key={f.n}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease }}
                  style={{ position: 'relative', zIndex: 1 }}>
                  <StepNumber n={f.n} />
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                  {f.n === '02' && (
                    <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      → takefyy.com/tu-restaurante
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--brand-dark)', padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: '20%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Phone con animación y glow */}
            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease }} className="flex justify-center md:justify-start">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  filter: 'drop-shadow(0 32px 64px rgba(255,107,53,0.22)) drop-shadow(0 8px 24px rgba(0,0,0,0.45))',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 280, height: 280,
                  background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: -1,
                }} />
                <PhoneMockup />
              </motion.div>
            </motion.div>

            {/* Feature list */}
            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}>
              <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>QUÉ INCLUYE</p>
              <h2 className="font-bold mb-10" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.15 }}>
                Todo lo que necesitás,
                <br />nada de lo que no.
              </h2>
              <div className="flex flex-col gap-4">
                {showcaseFeatures.map((f, i) => (
                  <motion.div key={f}
                    initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease }}
                    className="flex items-start gap-3">
                    <span style={{ color: 'var(--accent)', fontSize: 16, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span className="text-sm" style={{ color: 'rgba(240,237,232,0.8)', lineHeight: 1.5 }}>{f}</span>
                  </motion.div>
                ))}
              </div>

              {/* Demo link */}
              <Link
                href="/riqqsburgers"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--accent)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: 28,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,107,53,0.3)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,107,53,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)')}
              >
                Ver demo en vivo: takefyy.com/riqqsburgers →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="precios" style={{ background: 'var(--bg)', padding: '96px 0' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>PRECIOS</p>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Un precio. Sin sorpresas.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease }}
                style={{
                  background: plan.featured ? 'var(--brand-dark)' : 'var(--surface)',
                  border: `1px solid ${plan.featured ? 'rgba(255,107,53,0.4)' : 'var(--border)'}`,
                  boxShadow: plan.featured
                    ? '0 0 0 1px rgba(255,107,53,0.1), 0 24px 64px rgba(255,107,53,0.2)'
                    : 'none',
                  borderRadius: 20, padding: 32, position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={!plan.featured ? (e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'var(--accent)'
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 16px 48px rgba(255,107,53,0.15)'
                } : undefined}
                onMouseLeave={!plan.featured ? (e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'var(--border)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                } : undefined}
              >
                {plan.featured && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                    background: 'linear-gradient(90deg, #FF6B35 0%, #ff8c5a 50%, #FF6B35 100%)',
                    backgroundSize: '200% auto',
                    animation: 'shimmer 2.5s linear infinite',
                    whiteSpace: 'nowrap',
                  }}>
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>{plan.name.toUpperCase()}</div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="font-bold" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', color: plan.featured ? '#fff' : 'var(--text-primary)', lineHeight: 1 }}>
                      {plan.price}
                    </span>
                    <span className="text-sm mb-1" style={{ color: plan.featured ? 'var(--dash-muted)' : 'var(--text-muted)' }}>{plan.period}</span>
                  </div>
                  <p className="text-sm" style={{ color: plan.featured ? 'var(--dash-muted)' : 'var(--text-secondary)' }}>{plan.desc}</p>
                </div>
                <div className="flex flex-col gap-3 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
                      <span className="text-sm" style={{ color: plan.featured ? 'rgba(240,237,232,0.8)' : 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: plan.featured ? 'var(--accent)' : 'transparent',
                    color: plan.featured ? '#fff' : 'var(--accent)',
                    border: plan.featured ? 'none' : '1.5px solid var(--accent)',
                    cursor: 'pointer', transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = '' }}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>
            14 días gratis · Sin tarjeta · Cancelás cuando querés
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section id="clientes" style={{ background: 'var(--brand-cream)', padding: '96px 0' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>TESTIMONIOS</p>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Lo que dicen nuestros clientes.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20, padding: 28,
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-6px)'
                  el.style.boxShadow = '0 20px 48px rgba(0,0,0,0.1)'
                  el.style.borderColor = 'rgba(255,107,53,0.3)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                  el.style.borderColor = 'var(--border)'
                }}
              >
                {/* Decorative quote */}
                <span style={{
                  position: 'absolute', top: -8, left: 16,
                  fontSize: 60, fontWeight: 900,
                  color: 'var(--accent)', opacity: 0.12,
                  lineHeight: 1, fontFamily: 'Georgia, serif',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}>&ldquo;</span>

                <div className="flex mb-3">
                  {'★★★★★'.split('').map((s, si) => (
                    <span key={si} style={{ color: 'var(--accent)', fontSize: 14 }}>{s}</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.restaurant}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: 'var(--bg)', padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease }} className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>FAQ</p>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Preguntas frecuentes.
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            style={{ borderTop: '1px solid var(--border)' }}>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#0E1116', padding: '112px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Orange glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(255,107,53,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
          pointerEvents: 'none',
        }} />

        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center" style={{ position: 'relative', zIndex: 1 }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-xs font-semibold tracking-widest mb-6"
            style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}
          >
            EMPEZÁ HOY
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.05, ease }}
            className="font-bold mb-6"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              letterSpacing: '-0.03em',
              color: '#fff',
              lineHeight: 1.05,
            }}
          >
            Tu carta, online.<br />
            <span style={{ color: 'var(--accent)' }}>Hoy.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12, ease }}
            className="mb-10"
            style={{ fontSize: 18, color: 'var(--dash-muted)', lineHeight: 1.6 }}
          >
            14 días gratis. Sin tarjeta. Cancelás cuando querés.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.18, ease }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={() => scrollTo('precios')}
              className="rounded-full font-bold text-white"
              style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer', padding: '18px 48px', fontSize: 18 }}
              whileHover={{ scale: 1.04, filter: 'brightness(1.1)', boxShadow: '0 8px 32px rgba(255,107,53,0.4)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Empezar gratis →
            </motion.button>
            <motion.a
              href="/riqqsburgers"
              className="rounded-full font-semibold"
              style={{ border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', background: 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '18px 40px', fontSize: 16 }}
              whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Ver demo →
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Gradient separator */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)',
      }} />

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--brand-dark)', padding: '64px 0 32px' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div>
              <div className="mb-3" style={{ color: 'var(--dash-text)' }}>
                <TakefyyLogo size="md" />
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'var(--dash-muted)', lineHeight: 1.6 }}>
                Tu carta, online en minutos.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <a href="https://instagram.com/takefyy" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                  Instagram
                </a>
                <a href="mailto:hola@takefyy.com"
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                  Contacto
                </a>
              </div>
            </div>
            <div className="flex gap-12">
              <div>
                <div className="text-xs font-semibold mb-4" style={{ color: 'var(--dash-muted)', letterSpacing: '0.1em' }}>PRODUCTO</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Funcionalidades', id: 'producto' },
                    { label: 'Precios', id: 'precios' },
                    { label: 'Clientes', id: 'clientes' },
                    { label: 'FAQ', id: 'faq' },
                  ].map(l => (
                    <button key={l.label} onClick={() => scrollTo(l.id)}
                      className="text-sm text-left"
                      style={{ color: 'var(--dash-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--dash-text)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-muted)')}
                    >{l.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-4" style={{ color: 'var(--dash-muted)', letterSpacing: '0.1em' }}>EMPRESA</div>
                <div className="flex flex-col gap-3">
                  <a href="https://instagram.com/takefyy" target="_blank" rel="noopener noreferrer"
                    className="text-sm" style={{ color: 'var(--dash-muted)', textDecoration: 'none' }}>Instagram</a>
                  <a href="mailto:hola@takefyy.com"
                    className="text-sm" style={{ color: 'var(--dash-muted)', textDecoration: 'none' }}>Contacto</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
              © 2026 Takefyy · Hecho en Argentina 🇦🇷 · Franco Riquero
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
