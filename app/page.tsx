import { getAllRestaurants } from '@/lib/getRestaurant'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Takefyy — Tu menú digital, tus pedidos por WhatsApp',
  description: 'Descubrí restaurantes y pedí fácil por WhatsApp.',
}

export default async function HomePage() {
  const restaurants = await getAllRestaurants()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-2 text-5xl">🍔</div>
        <h1
          className="text-6xl font-black tracking-tighter"
          style={{
            color: 'var(--accent)',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          Takefyy
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Tu menú digital, tus pedidos por WhatsApp
        </p>

        {restaurants.length > 0 && (
          <div className="w-full max-w-sm mt-12 flex flex-col gap-3 text-left">
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Negocios activos
            </p>
            {restaurants.map(r => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:shadow-md group"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <Image
                    src={r.logo}
                    alt={r.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {r.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {r.tagline}
                  </p>
                </div>
                <span
                  className="transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Takefyy — Pedí fácil, pagá como quieras
      </footer>
    </div>
  )
}
