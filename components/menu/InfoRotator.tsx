'use client'

import { useState, useEffect } from 'react'

interface InfoItem { icon: string; text: string }

const ICON_MAP: Record<string, string> = {
  '📍': '📍',
  '📞': '📞',
  '🕐': '🕐',
  '📸': '📸',
}

export default function InfoRotator({
  items,
  accent = '#FF6B35',
}: {
  items: InfoItem[]
  accent?: string
}) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % items.length)
        setVisible(true)
      }, 320)
    }, 3200)
    return () => clearInterval(interval)
  }, [items.length])

  if (!items.length) return null

  const item = items[current]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Rotating text */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'rgba(255,255,255,0.88)',
          fontWeight: 500, letterSpacing: '0.01em',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          minHeight: 24,
          textShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ fontSize: 14 }}>{item.icon}</span>
        <span>{item.text}</span>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true) }, 320) }}
              style={{
                width: i === current ? 16 : 5,
                height: 5,
                borderRadius: 999,
                background: i === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
