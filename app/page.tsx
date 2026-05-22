import { getAllRestaurants } from '@/lib/getRestaurant'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Takefyy — Tu menú digital, tus pedidos por WhatsApp',
  description: 'Descubrí restaurantes y pedí fácil por WhatsApp.',
}

export default async function HomePage() {
  const restaurants = await getAllRestaurants()
  const active = restaurants.length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0F0A06', color: '#fff' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden">

        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full"
            style={{
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 65%)',
              top: '-200px',
              left: '50%',
              marginLeft: '-300px',
              filter: 'blur(40px)',
              animation: 'heroFloat 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '350px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(255,179,71,0.08) 0%, transparent 65%)',
              bottom: '-80px',
              right: '-60px',
              filter: 'blur(60px)',
              animation: 'heroFloat 12s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '250px',
              height: '250px',
              background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 65%)',
              bottom: '40px',
              left: '-40px',
              filter: 'blur(50px)',
              animation: 'heroFloat 7s ease-in-out infinite',
            }}
          />
        </div>

        {/* Emoji with glowing ring */}
        <div
          className="animate-pulse-glow mb-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            width: '80px',
            height: '80px',
            fontSize: '44px',
            background: 'rgba(255,107,53,0.1)',
            border: '1.5px solid rgba(255,107,53,0.3)',
          }}
        >
          🍔
        </div>

        {/* Wordmark */}
        <h1
          className="font-black tracking-tighter leading-none"
          style={{
            fontSize: 'clamp(72px, 14vw, 140px)',
            color: '#FF6B35',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            textShadow: '0 0 120px rgba(255,107,53,0.25)',
          }}
        >
          Takefyy
        </h1>

        <p
          className="mt-5 text-base md:text-lg max-w-sm leading-relaxed"
          style={{ color: '#6B5A50' }}
        >
          Tu menú digital, tus pedidos por WhatsApp
        </p>

        {/* Stats pill */}
        <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
          <span
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(255,107,53,0.12)',
              border: '1px solid rgba(255,107,53,0.25)',
              color: '#FF6B35',
            }}
          >
            {active} {active === 1 ? 'restaurante activo' : 'restaurantes activos'}
          </span>
        </div>
      </section>

      {/* ── Restaurants grid ──────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-24">
        {restaurants.length > 0 ? (
          <>
            <p
              className="text-xs uppercase tracking-widest mb-6"
              style={{ color: '#3D3028', letterSpacing: '0.15em' }}
            >
              Negocios activos
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map(r => {
                const initials = r.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()

                const logoSrc = r.logo || (r.slug === 'riqqsburgers' ? '/logo.png' : '')

                return (
                  <Link
                    key={r.slug}
                    href={`/${r.slug}`}
                    className="restaurant-card group rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-sm"
                  >
                    {/* Top row: logo + name + tagline */}
                    <div className="flex items-center gap-4">
                      {/* Logo circle */}
                      <div
                        className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-lg"
                        style={{
                          width: '60px',
                          height: '60px',
                          border: '2px solid #FF6B35',
                          backgroundColor: r.logo ? 'rgba(255,107,53,0.1)' : '#FF6B35',
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
                        <p className="text-sm mt-0.5 truncate" style={{ color: '#6B5A50' }}>
                          {r.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Bottom row: status badge + hover CTA */}
                    <div className="flex items-center justify-between">
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
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-24" style={{ color: '#3D3028' }}>
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-sm">No hay restaurantes activos todavía.</p>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-6 text-center text-xs" style={{ color: '#2E2420' }}>
        Powered by Takefyy • {new Date().getFullYear()}
      </footer>
    </div>
  )
}
