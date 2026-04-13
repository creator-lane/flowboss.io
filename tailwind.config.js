/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
        },
        neutral: {
          50: '#F6F8FA',
          100: '#F0F3F5',
          200: '#E0E6EB',
          300: '#C4CED6',
          400: '#95A5B2',
          500: '#6E818F',
          700: '#3D4F63',
          900: '#1E293B',
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
