/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00A651',
        'primary-dark': '#009148',
        'primary-light': '#00bf5d',
      },
      maxWidth: {
        'screen-lg': '1024px',
        'mobile': '480px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      ringColor: {
        primary: 'var(--color-primary)',
      },
    },
  },
  plugins: [],
};