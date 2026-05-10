/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          50:  '#f0f9f4',
          100: '#dcf0e5',
          200: '#bbe1ce',
          300: '#8ccbad',
          400: '#57ae87',
          500: '#2D6A4F',
          600: '#266042',
          700: '#1f4f36',
          800: '#1b3f2c',
          900: '#173525',
        },
        accent: '#74C69D',
        warm: '#FFF8F0',
        danger: '#E63946',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
