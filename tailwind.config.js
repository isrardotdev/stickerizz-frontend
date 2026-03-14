/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f0ff',
          100: '#efe3ff',
          200: '#dfc8ff',
          300: '#c6a2ff',
          400: '#a66ef8',
          500: '#8539ef',
          600: '#7429db',
          700: '#6220b8',
          800: '#511d95',
          900: '#431a79',
          950: '#2d1154',
        },
      },
    },
  },
  plugins: [],
}
