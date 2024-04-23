/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'back-primary': '#000000',
        'back-secondary': '#BBBFCA'
      }
    }
  },
  plugins: []
}
