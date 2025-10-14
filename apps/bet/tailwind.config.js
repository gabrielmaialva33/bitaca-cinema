/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',
        secondary: '#2D5016',
        dark: '#0A0A0A',
      },
    },
  },
  plugins: [],
}
