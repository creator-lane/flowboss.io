/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Dynamic color classes used in HomePage interactive mocks
    ...['blue', 'green', 'purple', 'amber', 'indigo', 'rose', 'cyan'].flatMap((c) => [
      `bg-${c}-50`,
      `bg-${c}-100`,
      `bg-${c}-500`,
      `bg-${c}-500/10`,
      `bg-${c}-500/20`,
      `bg-${c}-500/30`,
      `text-${c}-300`,
      `text-${c}-500`,
      `text-${c}-600`,
      `text-${c}-700`,
      `border-${c}-200`,
    ]),
  ],
  theme: {
    extend: {
      keyframes: {
        'check-flash': {
          '0%': { backgroundColor: 'transparent' },
          '30%': { backgroundColor: 'rgb(187 247 208 / 0.5)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        // Signature amber breathing pulse on "work is happening" cards.
        // Kept subtle — 0.35 opacity ring max — so a board full of active
        // trades doesn't look like a Christmas tree.
        'amber-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
          '50%':      { boxShadow: '0 0 0 4px rgba(245, 158, 11, 0.35)' },
        },
        // Gentle slide-in for newly-added board cards / list items.
        'slide-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'check-flash': 'check-flash 0.6s ease-out',
        'toast-in': 'toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'amber-pulse': 'amber-pulse 2.4s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f1a3d',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        neutral: {
          50: '#F6F8FA',
          100: '#F0F3F5',
          200: '#E0E6EB',
          300: '#C4CED6',
          400: '#95A5B2',
          500: '#6E818F',
          600: '#536474',
          700: '#3D4F63',
          800: '#2A3A4C',
          900: '#1E293B',
          950: '#0f172a',
        },
        // Sidebar dark theme
        sidebar: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          border: '#334155',
          hover: '#1e293b',
          active: '#1e3a5f',
          text: '#94a3b8',
          'text-active': '#f1f5f9',
        },
        success: '#16a34a',
        warning: '#D97706',
        danger: '#dc2626',
        status: {
          scheduled: '#2563EB',
          inProgress: '#0891B2',
          completed: '#16A34A',
          paid: '#16A34A',
          overdue: '#DC2626',
          draft: '#64748B',
          sent: '#2563EB',
        },
      },
    },
  },
  plugins: [],
};
