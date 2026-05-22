'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({
  href,
  label = 'Volver',
}: {
  href?: string
  label?: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--text-secondary)',
        fontSize: 14,
        fontWeight: 500,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 0',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  )
}
