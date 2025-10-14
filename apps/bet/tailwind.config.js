/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bad Parenting inspired dark theme
        'blood-red': '#8B0000',
        'deep-red': '#4A0000',
        'shadow-black': '#0D0D0D',
        'void-black': '#050505',
        'pale-gray': '#2A2A2A',
        'dead-white': '#E0E0E0',
        'warning-red': '#FF0000',
        'toxic-green': '#00FF41',
        // Aliases for components
        'primary': '#C41E3A',
        'secondary': '#00C853',
        'dark': '#0D0D0D',
      },
      fontFamily: {
        'creepy': ['Creepster', 'cursive'],
        'horror': ['Special Elite', 'cursive'],
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'flicker': 'flicker 0.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'horror': '0 0 20px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.8)',
        'glow-red': '0 0 15px rgba(255, 0, 0, 0.8)',
        'inner-dark': 'inset 0 2px 15px rgba(0, 0, 0, 0.9)',
      },
    },
  },
  plugins: [],
}
