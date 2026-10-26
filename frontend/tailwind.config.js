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
        theme: {
          bg: '#14131b',
          card: '#1f1d2b',
          surface: '#252936',
          border: 'rgba(128, 129, 145, 0.2)',
          button: '#353340',
          accent: '#3b82f6',
          accentHover: '#2563eb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
