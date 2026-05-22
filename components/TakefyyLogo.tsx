export default function TakefyyLogo({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const scale = { sm: 0.6, md: 1, lg: 1.4 }[size]
  const unit = 10 * scale
  const gap = 2.5 * scale
  const r = 2 * scale

  const grid: (boolean | 'accent')[][] = [
    [true,  true,  true,  true,  true ],
    [true,  true,  true,  true,  true ],
    [false, false, true,  true,  false],
    [false, false, true,  true,  false],
    [false, 'accent', true, true, false],
  ]

  const cols = 5
  const rows = grid.length
  const svgW = cols * unit + (cols - 1) * gap
  const svgH = rows * unit + (rows - 1) * gap

  const wordmarkSize = { sm: 18, md: 26, lg: 36 }[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} fill="none" aria-hidden="true">
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            if (!cell) return null
            const x = ci * (unit + gap)
            const y = ri * (unit + gap)
            const fill = cell === 'accent' ? '#FF6B35' : '#0E1116'
            return (
              <rect
                key={`${ri}-${ci}`}
                x={x} y={y}
                width={unit} height={unit}
                rx={r} ry={r}
                fill={fill}
              />
            )
          })
        )}
      </svg>

      <span style={{ fontSize: wordmarkSize, lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', fontWeight: 700, color: '#0E1116', letterSpacing: '-0.03em' }}>
          takef
        </span>
        <span style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', fontWeight: 700, color: '#FF6B35', letterSpacing: '-0.03em' }}>
          yy
        </span>
      </span>
    </div>
  )
}
