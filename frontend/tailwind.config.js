/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          200: '#c3e4cd',
          300: '#95cea7',
          400: '#61b07c',
          500: '#3e945c',
          600: '#2f7748',
          700: '#275f3b',
          800: '#224c31',
          900: '#1d3f2b',
        },
        earth: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#ebdcc7',
          300: '#dfc3a3',
          400: '#d0a37b',
          500: '#c4885c',
          600: '#b4704b',
          700: '#96583f',
          800: '#7a4738',
          900: '#643c31',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

