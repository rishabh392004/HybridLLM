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
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          card: 'var(--color-surface-card)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
          focus: 'var(--color-border-focus)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
          subtle: 'var(--color-accent-subtle)',
        },
        severity: {
          normal: 'var(--color-sev-normal)',
          advisory: 'var(--color-sev-advisory)',
          warning: 'var(--color-sev-warning)',
          severe: 'var(--color-sev-severe)',
        },
        sources: {
          nwp: '#38bdf8',       // Light Sky Blue
          ensemble: '#818cf8',  // Indigo/Purple
          ai: '#34d399',        // Emerald / AI Green
          regional: '#f472b6',  // Pink/Coral
          blend: '#2dd4bf',     // Primary Teal Blend
          observed: '#f59e0b',  // Amber Dashed
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'control-room': '0 4px 20px -2px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'glow-teal': '0 0 15px -3px rgba(45, 212, 191, 0.35)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.45)',
      },
      borderRadius: {
        'control': '14px',
      },
      keyframes: {
        pulseSevere: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.25)', opacity: '0.6' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'pulse-severe': 'pulseSevere 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
}
