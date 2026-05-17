/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
      colors: {
        night:   { 900: '#050C18', 800: '#0D1B2E', 700: '#142338', 600: '#1C3050' },
        brand:   { 500: '#C0392B', 600: '#A93226', 400: '#E74C3C' },
        accent:  { 500: '#3B82F6', 400: '#60A5FA', 600: '#2563EB' },
        success: '#10B981',
        warning: '#F59E0B',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan-line':  'scanLine 2.5s linear infinite',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scanLine: { '0%': { top: '10%' }, '100%': { top: '90%' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
