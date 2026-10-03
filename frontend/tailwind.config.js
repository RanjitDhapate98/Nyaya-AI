/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 50: '#f5f6f9', 100: '#e9ecf2', 200: '#cfd5e2', 300: '#a7b1c7', 400: '#7987a6', 500: '#56658a', 600: '#435070', 700: '#36405b', 800: '#232b40', 900: '#151b2c', 950: '#0d1120' },
        parchment: '#f7f5f0',
        brass: { 50: '#fbf6ea', 100: '#f4e8c7', 300: '#dcb966', 400: '#cfa23f', 500: '#b8892b', 600: '#986d21', 700: '#78541c' },
        risk: { high: '#b42318', medium: '#b54708', low: '#067647', none: '#667085' },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)' },
    },
  },
  plugins: [],
};
