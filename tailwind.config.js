/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F7EFE7',
        'bg-secondary': '#BFB0A0',
        'text-primary': '#312C38',
        'text-secondary': '#6B7280',
        'accent': '#E73C37',
        'accent-light': '#EF5350',
        'accent-dark': '#D32F2F',
        'success': '#22C55E',
        'warning': '#F59E0B',
        'error': '#EF4444',
        primary: {
          DEFAULT: '#1e40af', // Blue-800 (darker blue)
          light: '#3b82f6', // Blue-500
          dark: '#1e3a8a', // Blue-900
          100: '#dbeafe', // Blue-100
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-success',
    'bg-warning',
    'bg-error',
    'text-success',
    'text-warning',
    'text-error',
    'border-success',
    'border-warning',
    'border-error',
    {
      pattern: /(bg|text|border)-(primary|secondary|accent|white|black)/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
}
