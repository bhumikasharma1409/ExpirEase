/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plum: '#21182B',
        aubergine: '#35263F',
        lime: '#C7F36B',
        ivory: '#F5F0E7',
        muted: '#A99DB0',
        coral: '#D98B70',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 60px rgba(10, 5, 15, .2)',
      },
    },
  },
  plugins: [],
};
