'use client'

import { useState, useEffect } from 'react'

interface InfoRotatorProps {
  items: { icon: string; text: string }[]
  accent?: string
}

export default function InfoRotator({ items, accent = '#FF6B35' }: InfoRotatorProps) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % items.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [items.length])

  if (!items.length) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 24,
      overflow: 'hidden',
    }}>
      <span style={{ fontSize: 13 }}>{items[current].icon}</span>
      <span style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '240px',
      }}>
        {items[current].text}
      </span>
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
          {items.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 12 : 4,
              height: 4,
              borderRadius: 2,
              background: i === current ? accent : 'var(--border)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
