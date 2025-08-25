import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0f14',
          soft: '#0f141b',
          elevated: '#121926',
        },
        primary: {
          DEFAULT: '#4f9cff',
          dim: '#2f6fd6',
        },
        accent: '#22d3ee',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: {
          DEFAULT: '#e5e7eb',
          soft: '#cbd5e1',
          dim: '#94a3b8',
        }
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.35)',
      }
    },
  },
  plugins: [],
} satisfies Config
