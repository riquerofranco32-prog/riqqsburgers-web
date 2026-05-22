'use client'

import { useRef } from 'react'

interface InfoItem { icon: string; text: string }

export default function InfoRotator({
  items,
  accent = '#FF6B35',
}: {
  items: InfoItem[]
  accent?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  if (!items.length) return null

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        paddingBottom: 1,
      }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 11 }}>{item.icon}</span>
          {item.text}
        </span>
      ))}
    </div>
  )
}
