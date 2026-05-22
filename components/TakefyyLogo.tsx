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
      <svg width={px} height={px} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="#0E1116"/>
        {/* Horizontal bar of T */}
        <rect x="6" y="9" width="28" height="7" rx="1.5" fill="#FF6B35"/>
        {/* Vertical stem of T */}
        <rect x="16.5" y="16" width="7" height="16" rx="1.5" fill="#FF6B35"/>
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
