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
        primary: '#3b82f6',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        neutral: '#6b7280',
        surface: {
          light: '#ffffff',
          dark: '#1f2937',
        },
        bg: {
          light: '#f4f6f9',
          dark: '#111827',
        },
        sidebar: {
          light: '#1e2130',
          dark: '#0f172a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
