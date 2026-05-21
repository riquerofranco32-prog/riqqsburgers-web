import type { Metadata } from 'next'
import { Syne, Inter } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Riqq's Burgers — Pedí online",
  description: 'Amor a primera mordida. Armá tu pedido y cerramos por WhatsApp.',
  openGraph: {
    title: "Riqq's Burgers",
    description: 'Amor a primera mordida 🍔',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${inter.variable}`}>
      <body className="bg-[#0d0d0d] text-white min-h-screen antialiased font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  )
}
