interface TakefyyLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  iconOnly?: boolean
}

const sizes = { sm: 28, md: 36, lg: 48 }
const fontSizes = { sm: '1rem', md: '1.25rem', lg: '1.6rem' }

export default function TakefyyLogo({ size = 'md', className = '', iconOnly = false }: TakefyyLogoProps) {
  const px = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={px} height={px} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="200" height="200" rx="44" fill="#0E1116"/>
        <g fill="#F4EFE6">
          {/* Top bar row 1 */}
          <rect x="40" y="40" width="26" height="26" rx="4"/>
          <rect x="70" y="40" width="26" height="26" rx="4"/>
          <rect x="100" y="40" width="26" height="26" rx="4"/>
          <rect x="130" y="40" width="26" height="26" rx="4"/>
          {/* Top bar row 2 */}
          <rect x="40" y="70" width="26" height="26" rx="4"/>
          <rect x="70" y="70" width="26" height="26" rx="4"/>
          <rect x="100" y="70" width="26" height="26" rx="4"/>
          <rect x="130" y="70" width="26" height="26" rx="4"/>
          {/* Stem row 3 */}
          <rect x="70" y="100" width="26" height="26" rx="4"/>
          <rect x="100" y="100" width="26" height="26" rx="4"/>
          <rect x="130" y="100" width="26" height="26" rx="4"/>
          {/* Stem row 4 */}
          <rect x="70" y="130" width="26" height="26" rx="4"/>
          <rect x="100" y="130" width="26" height="26" rx="4"/>
          <rect x="130" y="130" width="26" height="26" rx="4"/>
          {/* Stem row 5 — left and right, coral center */}
          <rect x="70" y="160" width="26" height="26" rx="4"/>
          <rect x="130" y="160" width="26" height="26" rx="4"/>
        </g>
        {/* Coral accent pixel */}
        <rect x="100" y="160" width="26" height="26" rx="4" fill="#FF5C3C"/>
      </svg>

      {!iconOnly && (
        <span style={{
          fontFamily: 'var(--font-sans), Space Grotesk, system-ui, sans-serif',
          fontWeight: 600,
          fontSize: fontSizes[size],
          color: 'inherit',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Takefyy
        </span>
      )}
    </div>
  )
}
