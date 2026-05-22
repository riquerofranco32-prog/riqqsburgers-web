import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <span className="text-7xl select-none">🍔</span>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Este negocio no existe en Takefyy
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          El restaurante que buscás no está registrado.
        </p>
      </div>
      <Link
        href="/"
        className="font-bold px-6 py-3 rounded-full text-sm text-white transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Volver al inicio →
      </Link>
    </div>
  )
}
