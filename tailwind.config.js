/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PiPump Brand Colors
        pi: {
          bg:       '#08080E',      // Deep space black
          card:     '#10101A',      // Card background
          border:   '#1E1E2E',      // Subtle borders
          lime:     '#C8FF00',      // Primary neon lime (CTA, accents)
          purple:   '#7C3AED',      // Pi purple
          purpleLt: '#A855F7',      // Light purple
          muted:    '#6B7280',      // Muted text
          text:     '#E8E8F0',      // Body text
          white:    '#FFFFFF',
          red:      '#FF4444',      // Sell / danger
          green:    '#22C55E',      // Buy / positive
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],   // Headers - distinctive
        mono:    ['Space Mono', 'monospace'], // Numbers, tickers
        body:    ['DM Sans', 'sans-serif'],  // Body text
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
        `,
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.25), transparent)',
        'lime-glow': 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(200,255,0,0.08), transparent)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-lime':  'pulseLime 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'ticker-scroll': 'tickerScroll 30s linear infinite',
        'glow':        'glow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseLime: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,255,0,0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(200,255,0,0.25)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        tickerScroll: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
      boxShadow: {
        'lime':   '0 0 20px rgba(200,255,0,0.3)',
        'purple': '0 0 20px rgba(124,58,237,0.4)',
        'card':   '0 4px 24px rgba(0,0,0,0.4)',
        'inner-lime': 'inset 0 0 20px rgba(200,255,0,0.05)',
      },
      screens: {
        'xs': '360px',  // Small mobile (Pi Browser)
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}
