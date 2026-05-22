import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#F5A623',
        orange: '#FF6B35',
        card: '#1a1a1a',
        border: '#2a2a2a',
        muted: '#888888',
        // Design system — map to CSS vars defined in globals.css
        'dash-bg':       'var(--dash-bg)',
        'dash-surface':  'var(--dash-surface)',
        'dash-surface-2':'var(--dash-surface-2)',
        'dash-border':   'var(--dash-border)',
        'dash-text':     'var(--dash-text)',
        'dash-muted':    'var(--dash-muted)',
        'accent':        'var(--accent)',
      },
      animation: {
        'spin-slow': 'spin 5s linear infinite',
        'fade-up': 'fadeUp 0.2s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(245,166,35,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(245,166,35,0.6)' },
        },
      },
      boxShadow: {
        'brand-sm': '0 0 12px rgba(245,166,35,0.15)',
        'brand-md': '0 0 24px rgba(245,166,35,0.25)',
        'brand-lg': '0 0 40px rgba(245,166,35,0.3)',
      },
    },
  },
  plugins: [],
}
export default config
