/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Backgrounds */
        background: 'var(--bg-void)',
        void:       'var(--bg-void)',
        surface: {
          DEFAULT: 'var(--bg-panel)',
          hover:   'var(--bg-panel-hover)',
          active:  'var(--bg-panel-raised)',
          raised:  'var(--bg-panel-raised)',
          card:    'var(--bg-panel)',
        },
        border: {
          DEFAULT: 'var(--border)',
          muted:   'var(--border-muted)',
          strong:  'var(--border-strong)',
          focus:   'var(--blend)',
          accent:  'var(--border-accent)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          data:      'var(--text-data)',
        },
        /* Output colors */
        accent: {
          DEFAULT: 'var(--blend)',
          hover:   'var(--color-accent-hover)',
          muted:   'var(--blend-glow)',
          subtle:  'var(--color-accent-subtle)',
        },
        blend:    'var(--blend)',
        observed: 'var(--observed)',
        /* Source identity — semantic, permanent */
        source: {
          nwp:      'var(--source-nwp)',
          ai:       'var(--source-ai)',
          ensemble: 'var(--source-ensemble)',
          regional: 'var(--source-regional)',
        },
        /* Legacy compat */
        indigo: {
          accent: 'var(--source-ai)',
          hover:  'var(--color-indigo-hover)',
          muted:  'var(--color-indigo-muted)',
        },
        severity: {
          normal:   'var(--alert-ok)',
          advisory: 'var(--alert-advisory)',
          warning:  'var(--alert-warning)',
          severe:   'var(--alert-severe)',
        },
        /* Legacy sources mapping */
        sources: {
          nwp:      'var(--source-nwp)',
          ensemble: 'var(--source-ensemble)',
          ai:       'var(--source-ai)',
          regional: 'var(--source-regional)',
          blend:    'var(--blend)',
          observed: 'var(--observed)',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        data:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, #2dd4bf 0%, #a78bfa 100%)',
        'grad-aurora':  'linear-gradient(135deg, #14b8a6 0%, #7c3aed 60%, #a78bfa 100%)',
        'grad-amber':   'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'grad-surface': 'linear-gradient(180deg, #0d1422 0%, #060a14 100%)',
        'grad-nwp':     'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        'grad-ai':      'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      },
      boxShadow: {
        'panel':        '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.35)',
        'panel-lg':     '0 0 0 1px rgba(255,255,255,0.08), 0 12px 48px rgba(0,0,0,0.50)',
        'glow-blend':   '0 0 20px -3px rgba(45,212,191,0.38)',
        'glow-blend-lg':'0 0 40px -6px rgba(45,212,191,0.48)',
        'glow-teal':    '0 0 20px -3px rgba(45,212,191,0.38)',
        'glow-teal-lg': '0 0 40px -6px rgba(45,212,191,0.48)',
        'glow-ai':      '0 0 20px -3px rgba(167,139,250,0.38)',
        'glow-nwp':     '0 0 20px -3px rgba(59,130,246,0.38)',
        'glow-amber':   '0 0 20px -3px rgba(245,158,11,0.38)',
        'glow-red':     '0 0 20px -3px rgba(239,68,68,0.45)',
        'glow-indigo':  '0 0 20px -3px rgba(167,139,250,0.38)',
        'control-room': '0 4px 24px -4px rgba(0,0,0,0.40)',
        'card-hover':   '0 8px 32px rgba(0,0,0,0.40)',
        'inner-shine':  'inset 0 1px 0 rgba(255,255,255,0.08)',
        'btn-primary':  '0 4px 16px rgba(45,212,191,0.22)',
        'btn-primary-h':'0 6px 24px rgba(45,212,191,0.32)',
      },
      borderRadius: {
        'control': '10px',
        '2xl':     '16px',
        '3xl':     '20px',
        '4xl':     '24px',
      },
      keyframes: {
        pulseSevere: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.25)', opacity: '0.6' },
        },
        shimmerWave: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(45,212,191,0.20)' },
          '50%':      { boxShadow: '0 0 24px rgba(45,212,191,0.50)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        severeBreath: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(239,68,68,0.22)' },
        },
        trustPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      animation: {
        'pulse-severe':    'pulseSevere 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':         'shimmerWave 1.8s ease-in-out infinite',
        'fade-in-up':      'fadeInUp 400ms cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':         'fadeIn 300ms ease both',
        'glow-pulse':      'glowPulse 2.5s ease-in-out infinite',
        'slide-down':      'slideDown 300ms cubic-bezier(0.22,1,0.36,1) both',
        'severe-breath':   'severeBreath 2s ease-in-out infinite',
        'trust-pulse':     'trustPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
