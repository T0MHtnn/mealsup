import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          strong: 'var(--color-primary-strong)',
        },
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
        },
        surface: {
          100: 'var(--color-surface-100)',
          200: 'var(--color-surface-200)',
        },
        tint: {
          sage: 'var(--color-tint-sage)',
          sand: 'var(--color-tint-sand)',
          clay: 'var(--color-tint-clay)',
          sky: 'var(--color-tint-sky)',
        },
        border: 'var(--color-border)',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Karla', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
      },
      spacing: {
        4.5: '18px',
      },
    },
  },
  plugins: [],
} satisfies Config
