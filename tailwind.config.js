/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f2f7f1',
          100: '#dfeedd',
          600: '#3a6347',
          700: '#2d4f38',
          900: '#17241b',
        },
        gold: {
          400: '#d8a441',
          500: '#c8861a',
          700: '#8f5d13',
        },
        cream: '#faf8f3',
        ink: '#1e2d1e',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 35px rgba(30,45,30,0.12)',
      },
    },
  },
  plugins: [],
};
